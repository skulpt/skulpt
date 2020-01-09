var $builtinmodule = function (name) {
    var request = {};
    request.AI = {}
    request.my_info = new Sk.builtin.func(function () {
        var openId = sessionStorage.getItem('author_openid')
        console.log(openId)
        var prom = new Promise(function(resolve, reject) {
            $.ajax({
                url: '/api/courseapi/user/info',
                type: 'GET',
                data: {openId: openId},
                success: function(data) {
                    var ret = new Sk.builtin.dict([]);
                    ret.mp$ass_subscript(new Sk.builtin.str('姓名'), new Sk.builtin.str(data.data['name']))
                    ret.mp$ass_subscript(new Sk.builtin.str('入学日期'), new Sk.builtin.str(data.data['registerTime']))
                    ret.mp$ass_subscript(new Sk.builtin.str('作品数'), new Sk.builtin.str(data.data['workNum']))
                    ret.mp$ass_subscript(new Sk.builtin.str('代码数'), new Sk.builtin.str(data.data['codeLineNum']))
                    ret.mp$ass_subscript(new Sk.builtin.str('点赞数'), new Sk.builtin.str(data.data['likeNum']))
                    resolve(ret)
                }
            });
        });

        var susp = new Sk.misceval.Suspension();

        susp.resume = function() {
            return resolution;
        };

        susp.data = {
            type: "Sk.promise",
            promise: prom.then(function(value) {
                resolution = value;
                return value;
            }, function(err) {
                resolution = "";
                return err;
            })
        };

        return susp;
    });

    request.play = new Sk.builtin.func(function (file) {
        var prom = new Promise(function(resolve, reject) {
            window.globalBgSpeak = {_pythonBgSMusic: 'true'};
            var playMusic = document.getElementById('pythonPlay');
            if(window.stopFrontProgram === 'false') {
                window.globalBgSpeak = null;
                reslove(file);
                return;
            }
            playMusic.currentTime = 0;
            playMusic.setAttribute('src','/static/MP3/airshipMP.wav');
            playMusic.play();
            let interVal = setInterval(() => {
                if(window.globalBgSpeak === null) {
                    playMusic.pause();
                    playMusic.setAttribute('src','');
                    clearInterval(interVal);
                    resolve(file);
                }
            }, 50);
        });
        var susp = new Sk.misceval.Suspension();
        susp.resume = function() {
            return resolution;
        };
        susp.data = {
            type: "Sk.promise",
            promise: prom.then(function(text) {
                resolution = text.v;
            }, function(err) {
                resolution = '';
                return err;
            })
        };
        return susp;
    });

    var ai = function($gbl, $loc) {
        $loc.speak = new Sk.builtin.func(function (self, text) {
            var prom = new Promise(function(resolve, reject) {
                window.globalVariSpeak = {_pythonSpeaks: text.v};
                document.getElementById('pythonSpeak666').click();
                let interVal = setInterval(() => {
                    if(window.globalVariSpeak === null) {
                        clearInterval(interVal);
                        resolve(text);
                    }
                }, 50);
            });
            var susp = new Sk.misceval.Suspension();
            susp.resume = function() {
                return resolution;
            };
            susp.data = {
                type: "Sk.promise",
                promise: prom.then(function(text) {
                    resolution = text.v;
                }, function(err) {
                    resolution = '';
                    return err;
                })
            };
            return susp;
        });

    }
    request.AI = Sk.misceval.buildClass(request, ai, "AI", []) 

    request.speak = new Sk.builtin.func(function (text, role) {
        var prom = new Promise(function(resolve, reject) {
            window.globalVariSpeak = {_pythonSpeaks: text.v};
            document.getElementById('pythonSpeak666').click();
            let interVal = setInterval(() => {
                if(window.globalVariSpeak === null) {
                    clearInterval(interVal);
                    resolve(text);
                }
            }, 50);
        });
        var susp = new Sk.misceval.Suspension();
        susp.resume = function() {
            return resolution;
        };
        susp.data = {
            type: "Sk.promise",
            promise: prom.then(function(text) {
                resolution = text.v;
            }, function(err) {
                resolution = '';
                return err;
            })
        };
        return susp;
    });

    return request;
};