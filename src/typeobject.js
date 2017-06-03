/* Cooperative 'super' */

Sk.builtin.superbi = function superbi () {
//static int
//super_init(PyObject *self, PyObject *args, PyObject *kwds)
//{
    superobject *su = (superobject *)self;
    PyTypeObject *type;
    PyObject *obj = NULL;
    PyTypeObject *obj_type = NULL;

    if (!_PyArg_NoKeywords("super", kwds))
        return -1;
    if (!PyArg_ParseTuple(args, "O!|O:super", &PyType_Type, &type, &obj))
        return -1;
    if (obj == Py_None)
        obj = NULL;
    if (obj != NULL) {
        obj_type = supercheck(type, obj);
        if (obj_type == NULL)
            return -1;
    }
    return 0;
//}
};

static PyMemberDef super_members[] = {
    {"__thisclass__", T_OBJECT, offsetof(superobject, type), READONLY,
     "the class invoking super()"},
    {"__self__",  T_OBJECT, offsetof(superobject, obj), READONLY,
     "the instance invoking super(); may be None"},
    {"__self_class__", T_OBJECT, offsetof(superobject, obj_type), READONLY,
     "the type of the instance invoking super(); may be None"},
    {0}
};

static PyObject *
super_repr(PyObject *self)
{
    superobject *su = (superobject *)self;

    if (su->obj_type)
        return PyString_FromFormat(
            "<super: <class '%s'>, <%s object>>",
            su->type ? su->type->tp_name : "NULL",
            su->obj_type->tp_name);
    else
        return PyString_FromFormat(
            "<super: <class '%s'>, NULL>",
            su->type ? su->type->tp_name : "NULL");
}

static PyObject *
super_getattro(PyObject *self, PyObject *name)
{
    superobject *su = (superobject *)self;
    int skip = su->obj_type == NULL;

    if (!skip) {
        /* We want __class__ to return the class of the super object
           (i.e. super, or a subclass), not the class of su->obj. */
        skip = (PyString_Check(name) &&
            PyString_GET_SIZE(name) == 9 &&
            strcmp(PyString_AS_STRING(name), "__class__") == 0);
    }

    if (!skip) {
        PyObject *mro, *res, *tmp, *dict;
        PyTypeObject *starttype;
        descrgetfunc f;
        Py_ssize_t i, n;

        starttype = su->obj_type;
        mro = starttype->tp_mro;

        if (mro == NULL)
            n = 0;
        else {
            assert(PyTuple_Check(mro));
            n = PyTuple_GET_SIZE(mro);
        }
        for (i = 0; i < n; i++) {
            if ((PyObject *)(su->type) == PyTuple_GET_ITEM(mro, i))
                break;
        }
        i++;
        res = NULL;
        for (; i < n; i++) {
            tmp = PyTuple_GET_ITEM(mro, i);
            if (PyType_Check(tmp))
                dict = ((PyTypeObject *)tmp)->tp_dict;
            else if (PyClass_Check(tmp))
                dict = ((PyClassObject *)tmp)->cl_dict;
            else
                continue;
            res = PyDict_GetItem(dict, name);
            if (res != NULL) {
                Py_INCREF(res);
                f = Py_TYPE(res)->tp_descr_get;
                if (f != NULL) {
                    tmp = f(res,
                        /* Only pass 'obj' param if
                           this is instance-mode super
                           (See SF ID #743627)
                        */
                        (su->obj == (PyObject *)
                                    su->obj_type
                            ? (PyObject *)NULL
                            : su->obj),
                        (PyObject *)starttype);
                    Py_DECREF(res);
                    res = tmp;
                }
                return res;
            }
        }
    }
    return PyObject_GenericGetAttr(self, name);
}

static PyTypeObject *
supercheck(PyTypeObject *type, PyObject *obj)
{
    /* Check that a super() call makes sense.  Return a type object.

       obj can be a new-style class, or an instance of one:

       - If it is a class, it must be a subclass of 'type'.      This case is
         used for class methods; the return value is obj.

       - If it is an instance, it must be an instance of 'type'.  This is
         the normal case; the return value is obj.__class__.

       But... when obj is an instance, we want to allow for the case where
       Py_TYPE(obj) is not a subclass of type, but obj.__class__ is!
       This will allow using super() with a proxy for obj.
    */

    /* Check for first bullet above (special case) */
    if (PyType_Check(obj) && PyType_IsSubtype((PyTypeObject *)obj, type)) {
        Py_INCREF(obj);
        return (PyTypeObject *)obj;
    }

    /* Normal case */
    if (PyType_IsSubtype(Py_TYPE(obj), type)) {
        Py_INCREF(Py_TYPE(obj));
        return Py_TYPE(obj);
    }
    else {
        /* Try the slow way */
        static PyObject *class_str = NULL;
        PyObject *class_attr;

        if (class_str == NULL) {
            class_str = PyString_FromString("__class__");
            if (class_str == NULL)
                return NULL;
        }

        class_attr = PyObject_GetAttr(obj, class_str);

        if (class_attr != NULL &&
            PyType_Check(class_attr) &&
            (PyTypeObject *)class_attr != Py_TYPE(obj))
        {
            int ok = PyType_IsSubtype(
                (PyTypeObject *)class_attr, type);
            if (ok)
                return (PyTypeObject *)class_attr;
        }

        if (class_attr == NULL)
            PyErr_Clear();
        else
            Py_DECREF(class_attr);
    }

    PyErr_SetString(PyExc_TypeError,
                    "super(type, obj): "
                    "obj must be an instance or subtype of type");
    return NULL;
}

static PyObject *
super_descr_get(PyObject *self, PyObject *obj, PyObject *type)
{
    superobject *su = (superobject *)self;
    superobject *newobj;

    if (obj == NULL || obj == Py_None || su->obj != NULL) {
        /* Not binding to an object, or already bound */
        Py_INCREF(self);
        return self;
    }
    if (Py_TYPE(su) != &PySuper_Type)
        /* If su is an instance of a (strict) subclass of super,
           call its type */
        return PyObject_CallFunctionObjArgs((PyObject *)Py_TYPE(su),
                                            su->type, obj, NULL);
    else {
        /* Inline the common case */
        PyTypeObject *obj_type = supercheck(su->type, obj);
        if (obj_type == NULL)
            return NULL;
        newobj = (superobject *)PySuper_Type.tp_new(&PySuper_Type,
                                                 NULL, NULL);
        if (newobj == NULL)
            return NULL;
        Py_INCREF(su->type);
        Py_INCREF(obj);
        newobj->type = su->type;
        newobj->obj = obj;
        newobj->obj_type = obj_type;
        return (PyObject *)newobj;
    }
}

static int
super_init(PyObject *self, PyObject *args, PyObject *kwds)
{
    superobject *su = (superobject *)self;
    PyTypeObject *type;
    PyObject *obj = NULL;
    PyTypeObject *obj_type = NULL;

    if (!_PyArg_NoKeywords("super", kwds))
        return -1;
    if (!PyArg_ParseTuple(args, "O!|O:super", &PyType_Type, &type, &obj))
        return -1;
    if (obj == Py_None)
        obj = NULL;
    if (obj != NULL) {
        obj_type = supercheck(type, obj);
        if (obj_type == NULL)
            return -1;
        Py_INCREF(obj);
    }
    Py_INCREF(type);
    Py_XSETREF(su->type, type);
    Py_XSETREF(su->obj, obj);
    Py_XSETREF(su->obj_type, obj_type);
    return 0;
}

PyDoc_STRVAR(super_doc,
"super(type, obj) -> bound super object; requires isinstance(obj, type)\n"
"super(type) -> unbound super object\n"
"super(type, type2) -> bound super object; requires issubclass(type2, type)\n"
"Typical use to call a cooperative superclass method:\n"
"class C(B):\n"
"    def meth(self, arg):\n"
"        super(C, self).meth(arg)");

static int
super_traverse(PyObject *self, visitproc visit, void *arg)
{
    superobject *su = (superobject *)self;

    Py_VISIT(su->obj);
    Py_VISIT(su->type);
    Py_VISIT(su->obj_type);

    return 0;
}

PyTypeObject PySuper_Type = {
    PyVarObject_HEAD_INIT(&PyType_Type, 0)
    "super",                                    /* tp_name */
    sizeof(superobject),                        /* tp_basicsize */
    0,                                          /* tp_itemsize */
    /* methods */
    super_dealloc,                              /* tp_dealloc */
    0,                                          /* tp_print */
    0,                                          /* tp_getattr */
    0,                                          /* tp_setattr */
    0,                                          /* tp_compare */
    super_repr,                                 /* tp_repr */
    0,                                          /* tp_as_number */
    0,                                          /* tp_as_sequence */
    0,                                          /* tp_as_mapping */
    0,                                          /* tp_hash */
    0,                                          /* tp_call */
    0,                                          /* tp_str */
    super_getattro,                             /* tp_getattro */
    0,                                          /* tp_setattro */
    0,                                          /* tp_as_buffer */
    Py_TPFLAGS_DEFAULT | Py_TPFLAGS_HAVE_GC |
        Py_TPFLAGS_BASETYPE,                    /* tp_flags */
    super_doc,                                  /* tp_doc */
    super_traverse,                             /* tp_traverse */
    0,                                          /* tp_clear */
    0,                                          /* tp_richcompare */
    0,                                          /* tp_weaklistoffset */
    0,                                          /* tp_iter */
    0,                                          /* tp_iternext */
    0,                                          /* tp_methods */
    super_members,                              /* tp_members */
    0,                                          /* tp_getset */
    0,                                          /* tp_base */
    0,                                          /* tp_dict */
    super_descr_get,                            /* tp_descr_get */
    0,                                          /* tp_descr_set */
    0,                                          /* tp_dictoffset */
    super_init,                                 /* tp_init */
    PyType_GenericAlloc,                        /* tp_alloc */
    PyType_GenericNew,                          /* tp_new */
    PyObject_GC_Del,                            /* tp_free */
};