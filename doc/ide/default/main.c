/*
 **************************************************************************
 *                             [ Muon Baryon ]                            *
 **************************************************************************
 *                      Synth, Visuals, Design: Ferris / Youth Uprising   *
 *  Code, Add. Design, Framework, Optimization: Decipher / Youth Uprising *
 *                                       Music: Gargaj / Ümlaüt Design    *
 *                     Add. Design, Bug Fixing: Duckers / Outracks        *
 *                                 Add. Design: Ehale / Youth Uprising    *
 *                                 Add. Design: Sephiron / Youth Uprising *
 *                             Special Mention: Mentor / TBC              *
 **************************************************************************
 * Thanks to Psycho / Loonies for his (however brief) explanation of the  *
 * sphere tracing algorithm, which has been hugely beaten, battered, and  *
 * pwned throughout the development of this intro.                        *
 **************************************************************************
 *         [c] 2009 Youth Uprising vs. Ümlaüt Design vs. Outracks         *
 **************************************************************************
 */

#include <windows.h>	// WinAPI main header.

#include <GL/glu.h>	// OpenGL Utility library header.

#include "GL/glext.h"	// OpenGL Extensions header.
#include "GL/wglext.h"	// OpenGL WGL-dependent Extensions header.

// Visual C++ needs _fltused for no fucking reason.
#if(defined(_MSC_VER))
	int _fltused = 0x00;
#endif // defined(_MSC_VER)

// Indicates a logical negativity.
#define dFalse			0x00

// Indicates a logical positivity.
#define dTrue			0x01

// + : + : + : + : + : + : + : + : + : + : + : + : + : + : + : Configuration + :

/*
 * If set to true, the following switch causes Fluff to use a maximized screen
 * without changing the screen resolution and forcing fullscreen.
 */
#define dNativeSize		dFalse

// If set as true, the following switch causes Fluff to hide the mouse cursor.
#define dHideCursor		dTrue

// If set as true, the ATI-fix shader code will be used.
#define dAtiFix			dFalse

// If set as true, the following switch causes Fluff to call ExitProcess().
#define dExitProcess		dTrue

// Width of the canvas in pixels.
#define dWidth			640

// Height of the canvas in pixels.
#define dHeight			480

// + : + : + : + : + : + : + : + : + : + : + : + : + : + Preprocessor Macros : +

// GPU program identifier replacement.
#define dProgram		(*(int *)pPointer)

// Fragment shader ID-code replacement.
#define dFragment		(*((int *)pPointer + 1))

// Time replacement.
#define dTime			dProgram

// + : + : + : + : + : + : + : + : + : + : + : + : + : + : + : GLSL Shaders  + :

// Vertex shaders.
static char const *const v[18] = {
	"varying float t,er,a1,a2,a3,o1,o2,r1;varying vec3 h1,h2,h3,lv,e;void m"
	"ain(){t=gl_Color.x*4294967.295;h1=vec3(1);h2=vec3(1.,.6,.06);h3=vec3(."
	"5,.75,1.);lv=vec3(200);a3=r1=0.;",
	"e=vec3(0,.7,-3);er=0.;float t2=t+min(float(int(t/16.)),2.)*2.;a1=a2=a3"
	"=0.;",
	"e.x=(t-8.)*.26;",
	"e.y+=(t-16.)*.03;a3=sin(t2*.3)*.1;",
	"e=vec3(0,5,0);er=sin(t2*.1)*2.+7.;a1-=.3;a2=sin(t2*.1)*1.2;er+=(t-32.)"
	"*.3;",
	"e=vec3(0,4,0);er=sin(t*.5)+3.02;a1=sin(t)*.1-.9;a2=sin(t*.2)*2.;a3=sin"
	"(t*.7)*.1;",
	"e=vec3(0);",
	"e.y+=(t-72.)*.2;er+=max((t-72.)*.4,0.);r1=1.;",
	"a1=sin(t*.8)*.2;",
	"er+=2.;a1-=.3;a2=sin(t*.14)*-2.;",
	"a2-=.6;",
	"lv=vec3(0,160.-(t-80.)*17.,200);e.z+=t*2.;a1*=.5;a2*=.4;a2+=.6;",
	"e.y=-e.y*1.5;a1=-a1;",
	"h1=mix(h1,vec3(0),max(min((t-123.)/3.,1.),0.));h2=vec3(.8,.4,.01);lv=v"
	"ec3(0,(t-96.)*10.-50.,200);e=vec3(0);er=3.-cos(t*.5);a1=sin(t)*.1;a2=s"
	"in(t*.2)*-.2;a3=sin(t*.7)*.1;",
	"er-=min(max((t-112.)/3.,0.),1.)*1.3;a2+=max(t-112.,0.)*.2;",
	"h2=h1;h1=mix(vec3(.8,.4,.01),vec3(.5,.7,.9),pow(min((t-128.)/5.,1.),2."
	"));lv=vec3(0,0,-100);e=vec3(t-128.+cos(t*.02),0,0);er=sin(t)+3.;a1=sin"
	"(t*.8)*.14;a2=sin(t*.3)*.12;a3=sin(t*1.1)*.2;",
	"e-=vec3(sin(a2)*er,0,cos(a2)*er);gl_Position=ftransform();}"
};

// Fragment shaders.
static char const *f[18] = {
	"varying float t,er,a1,a2,a3,r1;float cm=1.,i,b=0.,k=1.,rr=0.;varying v"
	"ec3 h1,h2,h3,lv,e;vec3 h;float n1(vec3 p){p.x+=p.y*57.+p.z*21.;return "
	"cos(p.x*sin(p.x));}float n2(vec3 p){vec3 a=floor(p),b=p-a;return mix(m"
	"ix(mix(n1(a),n1(a+vec3(1,0,0)),b.x),mix(n1(a+vec3(0,1,0)),n1(a+vec3(1,"
	"1,0)),b.x),b.y),mix(mix(n1(a+vec3(0,0,1)),n1(a+vec3(1,0,1)),b.x),mix(n"
	"1(a+vec3(0,1,1)),n1(a+1.),b.x),b.y),b.z)*.5+.5;}float pn(vec3 p){retur"
	"n n2(p*.06125)*.5+n2(p*.125)*.25+n2(p*.25)*.125;}float o(vec3 p){",
	"}float oo(vec3 p){",
	"float s=0.,a;p=vec3(fract(p.x*.25+.5)*4.-2.,p.y+sin(p.x*.5)*sin(sin(p."
	"z*.5)*2.+t)*.6,fract(p.z*.25+.5)*4.-2.);s=1.-max(77.-t,0.);return max("
	"abs(length(p.xz)-2.)-.3,abs(p.y+3.+(1.-s*s)*1.6)-.3);",
	"float s=0.,a;vec3 x=p;p=vec3(fract(p.x*.25+.5)*4.-2.,p.y,fract(p.z*.25"
	"+.5)*4.-2.);a=sin(sin(p.y+p.x-x.x+p.z-x.z)+t);p=vec3(p.x*cos(a)+p.z*si"
	"n(a),p.y,p.z*cos(a)-p.x*sin(a));p=vec3(p.x*cos(a)+p.y*sin(a),p.y*cos(a"
	")-p.x*sin(a),p.z);return max(max(abs(p.x)-.8,abs(p.y)-.8),abs(p.z)-.8)"
	";",
	"if(t>=48.&&t<128.)p.y+=(t-48.)*2.;return p.y+sin(p.x*.5)*sin(sin(p.z*."
	"5)*2.+t*.4)*.4;",
	"float a=sin(sin(t))*2.;p=vec3(p.x*cos(a)+p.z*sin(a),p.y,p.z*cos(a)-p.x"
	"*sin(a));a*=.7;p=vec3(p.x*cos(a)+p.y*sin(a),p.y*cos(a*.7)-p.x*sin(a),p"
	".z);return mix(mix(min(length(p+vec3(0,sin(t*4.)*.5,0))-.2,length(vec2"
	"(length(vec2(p.x,p.z))-.5,p.y))-.2),length(vec3(p.x*(sin(p.z*16.+t*3.)"
	"*.1+.9),p.y*(sin(p.x*16.+t*3.)*.1+.9),p.z*(sin(p.y*16.+t*3.)*.1+.9)))-"
	".3,max(min((t-112.)/5.,1.),0.)),max(max(abs(p.x)-.1,abs(p.y)-.25),abs("
	"p.z)-.1),pow(max(min((t-121.)/5.,1.),0.),2.));",
	"p=vec3(p.x,p.y+sin(p.x)*sin(sin(p.z)*2.+t)*.2+pow(max(min((t-102.)/15."
	",1.),0.),2.)*30.,p.z);return min(p.y+1.,max(p.y+.8,max(abs(p.x)-.8,abs"
	"(p.z)-.8)));",
	"float s=0.,a;a=sin(sin(t*.1));vec3 y=vec3(sin(t*.2),sin(t*.3),sin(t*.4"
	"))*.6;if(t>=32.){if((abs(p.x)>4.||abs(p.z)>4.)){p.y+=(t-32.)*.3;}else{"
	"s=min((t-32.)/14.,1.);}a*=1.-s;y*=1.-s*s;}p=vec3(mod(p.x+4.,8.)-4.,p.y"
	",mod(p.z+4.,8.)-4.);p=vec3(p.x*cos(a)+p.z*sin(a),p.y,p.z*cos(a)-p.x*si"
	"n(a));a*=2.;p=vec3(p.x,p.y*cos(a)+p.z*sin(a),p.z*cos(a)-p.y*sin(a));ve"
	"c3 x=fract(p)-.5;p+=y;return min(max(abs(p.x)-s*2.,max(abs(p.y)-s*2.,a"
	"bs(p.z)-s*2.)),max(length(p)-2.,max(abs(x.x)-.4,max(abs(x.y)-.4,abs(x."
	"z)-.4))));",
	"return max(-p.y-16.+15.*(1.-pow(max(min(1.-(t-64.)/7.,1.),0.),2.)),max"
	"(abs(p.x+sin(p.y*1.5+t*2.)*.15)-1.,max(p.y-1.,abs(p.z+sin(p.y*1.3+t*2."
	")*.15)-1.)));",
	"float a=length(vec2(p.x,p.y));return mix(max(max(3.-a,a-3.2),(116.-t)*"
	"3.-p.z),3.-length(vec3(p.x*(sin(p.z*6.+t*2.)*.01+.99),p.y*(sin(p.x*6.+"
	"t*2.)*.01+.99),p.z*(sin(p.y*6.+t*2.)*.01+.99))),max(min((t-120.)/3.,1."
	"),0.));",
	"float a=t+1.4*sin(p.x*.8);p=vec3(p.x,p.y*cos(a)+p.z*sin(a),p.z*cos(a)-"
	"p.y*sin(a));return max(max(p.x-(t-128.)-.2,max(abs(p.y)-.5,abs(p.z)-.2"
	")),-p.x);",
	"float s=0.,a;return min(p.y+1.+pow(1.-min((t-128.)/8.,1.),2.)*10.,1.)"
	";",
	"}float q(vec3 p){",
	"}float qq(vec3 p){",
	"return .6+.4*sin(p.y*.1+20.*pn(p*100.));",
	"return pn(p*1000.);",
	"return 1.;",
	"}float ooo(vec3 p){float d,d2;d=o(p);d2=oo(p);if(d<d2){k=q(p);b=0.;h=h"
	"1;rr=r1;}else{d=d2;k=1.;b=qq(p)*.03;h=h2;rr=1.;}return d;}void main(){"
	"float g=0.,d,w=0.;"

	// "vec3 v=normalize(vec3((gl_FragCoord.xy-vec2(160,120))/240.*1.4,1));"
	// "vec3 v=normalize(vec3((gl_FragCoord.xy-vec2(400,300))/600.*1.4,1));"
	// "vec3 v=normalize(vec3((gl_FragCoord.xy-vec2(640,360))/720.*1.4,1));"
	// "vec3 v=normalize(vec3((gl_FragCoord.xy-vec2(960,600))/1200.*1.4,1));"
	"vec3 v=normalize(vec3((gl_FragCoord.xy-vec2(320,240))/480.*1.4,1));"

	"v=vec3(v.x,v.y*cos(a1)+v.z*sin(a1),v.z*cos(a1)-v.y*sin(a1));v=vec3(v.x"
	"*cos(a3)+v.y*sin(a3),v.y*cos(a3)-v.x*sin(a3),v.z);v=vec3(v.x*cos(a2)+v"
	".z*sin(a2),v.y,v.z*cos(a2)-v.x*sin(a2));vec3 n,r,p=e,c=(h3+.2)*pow(1.-"
	"abs(v.y),2.)+(1.-pow(min(pn(v*220.-vec3(0,t*1.3,0))+.6,1.),8.))*pow(ma"
	"x(v.y,0.),2.)*.5+vec3(1,.7,.4)*pow(max(dot(v,normalize(lv))*1.01,0.),1"
	"05.),c2;if(t>=128.)c=c*.2+max(pow(min(pn(v*200.+t*5.)*1.5,1.),15.)-pn("
	"v*1200.),0.)*min((t-128.)/5.,1.);while(g<1.){g=length(p-e)/20.;d=ooo(p"
	");if(d<=0.001){vec3 l=normalize(lv-p+e);n=normalize(vec3(ooo(p+vec3(.0"
	"1,0,0))-d,ooo(p+vec3(0,.01,0))-d,ooo(p+vec3(0,0,.01))-d))+b;r=reflect("
	"l,n);if(cm==1.)c*=g;c2=((1.-g)*k*h*(max(dot(n,l),0.)+pow(max(dot(r,v),"
	"0.),17.)))*cm;for(i=1.;i<5.;i++)c2-=vec3((i*.2-ooo(p+n*i*.2))/pow(2.,i"
	"));c+=max(c2,0.);if (rr>0.&&w++<1.) {cm*=.5;p-=v*(d+.2);v=reflect(v,n)"
	";} else {break;}}p+=v*max(d,.002);}c*=min(t*.0625,1.);if(t>=92.&&t<96."
	")c*=1.-pow(min((t-92.)/4.,1.),2.);if(t>=96.)c*=min((t-96.)/5.,1.);if(t"
	">=140.)c*=1.-min((t-140.)/8.,1.);"

	// "c*=1.-.85*length(gl_FragCoord.xy-vec2(160,120))/240.;"
	// "c*=1.-.85*length(gl_FragCoord.xy-vec2(400,300))/600.;"
	// "c*=1.-.85*length(gl_FragCoord.xy-(640,360))/720.;"
	// "c*=1.-.85*length(gl_FragCoord.xy-vec2(960,600))/1200.;"
	 "c*=1.-.85*length(gl_FragCoord.xy-vec2(320,240))/480.;"

	"gl_FragColor=vec4(c,1);}"
};

// + : + : + : + : + : + : + : + : + : + : + : + : + : + : + : + : Framework : +

// Check if we are using the native screen size or not.
#if(!dNativeSize)
	/*!
	 * Device mode descriptor is required to be able to switch to
	 * fullscreen.
	 */
	static DEVMODE sFullscreen =
	{
		// dmDeviceName (PIXELFORMATDESCRIPTOR)		[32 bytes]
		{
			0, 0,			// nSize	[2 bytes]
			0, 0,			// nVersion	[2 bytes]

			/*
			 * PFD_DRAW_TO_WINDOW			[[ 0x04 ]]
			 * PFD_SUPPORT_OPENGL			[[ 0x20 ]]
			 * PFD_DOUBLEBUFFER			[[ 0x01 ]]
			 *
			 * [[ 0x00000025 ]] { 37, 0, 0, 0 } 	[le]
			 */

			37, 0, 0, 0,	// dwFlags		[4 bytes]

			PFD_TYPE_RGBA,	// iPixelType		[1 byte]

			0,		// cColorBits		[1 byte]
			0,		// cRedBits		[1 byte]
			0,		// cRedShift		[1 byte]
			0,		// cGreenBits		[1 byte]
			0,		// cGreenShift		[1 byte]
			0,		// cBlueBits		[1 byte]
			0,		// cBlueShift		[1 byte]
			0,		// cAlphaBits		[1 byte]
			0,		// cAlphaShift		[1 byte]
			0,		// cAccumBits		[1 byte]
			0,		// cAccumRedBits	[1 byte]
			0,		// cAccumGreenBits	[1 byte]
			0,		// cAccumBlueBits	[1 byte]
			0,		// cAccumAlphaBits	[1 byte]
			0,		// cDepthBits		[1 byte]
			0,		// cStencilBits		[1 byte]
			0,		// cAuxBuffers		[1 byte]
			0,		// iLayerType		[1 byte]
			0,		// bReserved		[1 byte]

			0, 0, 0, 0	// dwLayerMask		[4 bytes]
		},

		0,			// dmSpecVersion	[2 bytes]
		0,			// dmDriverVersion	[2 bytes]

		sizeof(DEVMODE),	// dmSize		[2 bytes]

		0,			// dmDriverExtra	[2 bytes]

		DM_PELSWIDTH |		// [ >> ]
		DM_PELSHEIGHT,		// dmFields		[4 bytes]

		{
			{
				0,	// dmOrientation	[2 bytes]
				0,	// dmPaperSize		[2 bytes]
				0,	// dmPaperLength	[2 bytes]
				0,	// dmPaperWidth		[2 bytes]
				0,	// dmScale		[2 bytes]
				0,	// dmCopies		[2 bytes]
				0,	// dmDefaultSource	[2 bytes]
				0,	// dmPrintQuality	[2 bytes]
			}
		},

		0,			// dmColor		[2 bytes]
		0,			// dmDuplex		[2 bytes]
		0,			// dmYResolution	[2 bytes]
		0,			// dmTTOption		[2 bytes]
		0,			// dmCollate		[2 bytes]

		{
			0		// dmFormName		[32 bytes]
		},

		0,			// dmLogPixels		[2 bytes]
		0,			// dmBitsPerPel		[4 bytes]
		dWidth,			// dmPelsWidth		[4 bytes]
		dHeight,		// dmPelsHeight		[4 bytes]

		{
			0		// dmDisplayFlags	[4 bytes]
		},

		0,			// dmDisplayFrequency	[4 bytes]

		#if(WINVER >= 0x0400)
			0,		// dmICMMethod		[4 bytes]
			0,		// dmICMIntent		[4 bytes]
			0,		// dmMediaType		[4 bytes]
			0,		// dmDitherType		[4 bytes]
			0,		// dmReserved1		[4 bytes]
			0,		// dmReserved2		[4 bytes]

			#if((WINVER >= 0x0500) || (_WIN32_WINNT >= 0x0400))
				0,	// dmPanningWidth	[4 bytes]
				0,	// dmPanningHeight	[4 bytes]
			#endif // (WINVER >= 0x0500) || (_WIN32_WINNT >= 0x0400)
		#endif // WINVER >= 0x0400
	};

	/*
	 * We use this pointer as a bank for everything, apparently this drops
	 * the size dramatically. I guess this hack has never been tried, not
	 * even in an assembly code; at least, not in the ones I have seen.
	 */
	static void *const pPointer = &sFullscreen;
#else
	/*
	 * We're using the native size, so we can't embed PIXELFORMATDESCRIPTOR
	 * into DEVMODE anymore.
	 */
	static PIXELFORMATDESCRIPTOR sFormat =
	{
		0,			// nSize		[2 bytes]
		0,			// nVersion		[2 bytes]

		PFD_DRAW_TO_WINDOW |	// [ >> ]
		PFD_SUPPORT_OPENGL |	// [ >> ]
		PFD_DOUBLEBUFFER,	// dwFlags		[4 bytes]

		PFD_TYPE_RGBA,		// iPixelType		[1 byte]

		0,			// cColorBits		[1 byte]
		0,			// cRedBits		[1 byte]
		0,			// cRedShift		[1 byte]
		0,			// cGreenBits		[1 byte]
		0,			// cGreenShift		[1 byte]
		0,			// cBlueBits		[1 byte]
		0,			// cBlueShift		[1 byte]
		0,			// cAlphaBits		[1 byte]
		0,			// cAlphaShift		[1 byte]
		0,			// cAccumBits		[1 byte]
		0,			// cAccumRedBits	[1 byte]
		0,			// cAccumGreenBits	[1 byte]
		0,			// cAccumBlueBits	[1 byte]
		0,			// cAccumAlphaBits	[1 byte]
		0,			// cDepthBits		[1 byte]
		0,			// cStencilBits		[1 byte]
		0,			// cAuxBuffers		[1 byte]
		0,			// iLayerType		[1 byte]
		0,			// bReserved		[1 byte]

		0,			// dwLayerMask		[4 bytes]
		0,			// dwVisibleMask	[4 bytes]
		0,			// dwDamageMask		[4 bytes]
	};

	/*
	 * Just to make sure everything is as transparent as possible between
	 * the two modes.
	 */
	static void *const pPointer = &sFormat;
#endif // !dNativeSize

struct part {
	unsigned char vertex[7];
	unsigned char fragment[4];

	unsigned char vertex_count;
};

static char const *sources[9];

static unsigned int p[13];
static struct part parts[13] = {
	{ { 1, 2 },			{ 4, 7, 16, 14 },	2 },
	{ { 1, 3 },			{ 4, 7, 16, 14 },	2 },
	{ { 1, 4 },			{ 4, 7, 16, 14 },	2 },
	{ { 5 },			{ 4, 8, 16, 14 },	1 },
	{ { 5, 6, 8, 10 },		{ 4, 8, 16, 14 },	4 },
	{ { 5, 6, 7, 8, 10 },		{ 2, 8, 16, 14 },	5 },
	{ { 5, 6, 7, 8, 10 },		{ 2, 3, 16, 15 },	5 },
	{ { 5, 6, 8, 9, 10 },		{ 4, 8, 16, 14 },	5 },
	{ { 5, 6, 7, 8, 10, 11 },	{ 2, 3, 16, 15 },	6 },
	{ { 5, 6, 7, 8, 10, 11, 12 },	{ 2, 3, 16, 15 },	7 },
	{ { 13 },			{ 6, 5, 16, 15 },	1 },
	{ { 13, 14 },			{ 9, 5, 16, 15 },	2 },
	{ { 15 },			{ 10, 11, 16, 16 },	1 }
};

#define glCreateProgram		\
	((PFNGLCREATEPROGRAMPROC)wglGetProcAddress("glCreateProgram"))

#define glCreateShader		\
	((PFNGLCREATESHADERPROC)wglGetProcAddress("glCreateShader"))

#define glShaderSource		\
	((PFNGLSHADERSOURCEPROC)wglGetProcAddress("glShaderSource"))

#define glCompileShader		\
	((PFNGLCOMPILESHADERPROC)wglGetProcAddress("glCompileShader"))

#define glAttachShader		\
	((PFNGLATTACHSHADERPROC)wglGetProcAddress("glAttachShader"))

#define glLinkProgram		\
	((PFNGLLINKPROGRAMPROC)wglGetProcAddress("glLinkProgram"))

#define glUseProgram		\
	((PFNGLUSEPROGRAMPROC)wglGetProcAddress("glUseProgram"))

extern void sonant_init();

//! Main entry point of the framework.
int WinMainCRTStartup()
{
	// Our window device context. Here for C89 compliance.
	HDC hContext;
	int i = 0;
	int j;
	int start;
	//int fonthandle;
	//unsigned char c;

	// Check if we are using the native screen size or not.
	#if(!dNativeSize)
		// Check if we'd like to hide the cursor.
		#if(dHideCursor)
			ShowCursor(
		#endif // dHideCursor

		ChangeDisplaySettings(pPointer, CDS_FULLSCREEN)

		// Complete the line if we're hiding the cursor.
		#if(dHideCursor)
			)
		#endif // dHideCursor

		; // Finalize the call.
	#endif // !dNativeSize

	// Create the window and grab the device context.
	hContext = GetDC(CreateWindow("edit", NULL, WS_POPUP | WS_VISIBLE |
				      WS_MAXIMIZE, 0, 0, 0, 0, NULL, NULL, NULL,
				      NULL));

	// Choose and set the pixel format.
	SetPixelFormat(hContext, ChoosePixelFormat(hContext, pPointer),
		       pPointer);

	// Create and attach the OpenGL rendering context.
	wglMakeCurrent(hContext, wglCreateContext(hContext));

	/*
	 * If we're using the native size, we seperately handle ShowCursor.
	 * Though, this is costlier than the method that uses
	 * ChangeDisplaySettings()'s return value. This takes 10 bytes whilst
	 * the method used by the non-native size mode takes 5 bytes.
	 */
	#if(dNativeSize && dHideCursor)
		ShowCursor(0);
	#endif // dNativeSize && dHideCursor

// + : + : + : + : + : + : + : + : + : + : + : + : + : Pre-generated Content : +

	// If you survive this, the shit should be kicking pretty hard!

	for (; i < 13; ++i) {
		p[i] = glCreateProgram();

		sources[0] = v[0];

		for (j = 0; j < parts[i].vertex_count; ++j) {
			sources[j + 1] = v[parts[i].vertex[j]];
		}

		sources[j + 1] = v[16];

		j = glCreateShader(GL_VERTEX_SHADER);
		glShaderSource(j, parts[i].vertex_count + 2, sources, NULL);
		glCompileShader(j);
		glAttachShader(p[i], j);

		sources[0] = f[0];
		sources[2] = f[1];
		sources[4] = f[12];
		sources[6] = f[13];
		sources[8] = f[17];

		for (j = 0; j < 4; ++j)
			sources[(j << 0x01) + 1] = f[parts[i].fragment[j]];

		j = glCreateShader(GL_FRAGMENT_SHADER);
		glShaderSource(j, 9, sources, NULL);
		glCompileShader(j);
		glAttachShader(p[i], j);

		glLinkProgram(p[i]);
		glUseProgram(p[i]);

		glRects(0,0,0,0);

		/*glFlush();
		glFinish();*/

		//SwapBuffers(hContext);
	}

	/*fonthandle = glGenLists(256);
    SelectObject(hContext,CreateFont(26 * dWidth / 640, // Height
                            0, // Width
                            0,0,
                            800, // Font weight (0 - 1000)
                            dFalse, // italic
                            dFalse, // underline
                            dFalse, // strikeout
                            ANSI_CHARSET,
                            OUT_TT_PRECIS, // Precision (TrueType in this case)
                            CLIP_DEFAULT_PRECIS,
                            ANTIALIASED_QUALITY,
                            FF_DONTCARE | DEFAULT_PITCH,
                            "Palatino Linotype")); // Font name
    wglUseFontBitmaps(hContext,0,256,fonthandle);*/

// + : + : + : + : + : + : + : + : + : + : + : + : + : + : + : + : + : + : + : +

	//sonant_init();
	start = timeGetTime();

	// Main loop.
	MainLoop:
// + : + : + : + : + : + : + : + : + : + : + : + : + : + : + : + : + Effects : +

		// Get the current tick.
		dTime = timeGetTime() - start;

		// Timeline, if this isn't epic I don't know what is...
		if (dTime < 16000)
				glUseProgram(p[0]);
			else if (dTime < 32000)
				glUseProgram(p[1]);
			else if (dTime < 48000)
				glUseProgram(p[2]);
			else if (dTime < 96000) {
				glUseProgram(p[3]);

				if (dTime > 56000) {
					glUseProgram(p[4]);

					if (dTime > 64000 && dTime < 72000)
						glUseProgram(p[7]);
					else {
						glUseProgram(p[5]);

						if (dTime > 74160)
							glUseProgram(p[6]);
					}
				}

				if (dTime > 80000) {
					glUseProgram(p[8]);

					if (dTime > 88000)
						glUseProgram(p[9]);
				}
			} else if (dTime < 128000) {
				glUseProgram(p[10]);

				if (dTime > 112000)
					glUseProgram(p[11]);
			} else
				glUseProgram(p[12]);

		// Hackalicous, pass the time to the shader for animation!
		glColor3uiv(pPointer);

		// Render-target. Sounds fancy, uh? No it's just a quad.
		glRects(-1, -1, 1, 1);

		/*if(dTime >= 140000 && dTime < 148000) {
			c = 255;
			if(dTime < 143000) c = c * (dTime - 140000) / 3000;
			if(dTime >= 145000) c -= c * (dTime - 145000) / 3000;
			glColor3ub(c,c,c);
			glBlendFunc(GL_SRC_COLOR,GL_ONE);
			glEnable(GL_BLEND);
			glUseProgram(0);
			glPushAttrib(GL_LIST_BIT);
			glListBase(fonthandle);
			glRasterPos2f(-.95f,-.7f);
			glCallLists(13,GL_UNSIGNED_BYTE,"* Muon Baryon");
			glRasterPos2f(-.91f,-.8f);
			glCallLists(41,GL_UNSIGNED_BYTE,"Youth Uprising . Ümlaüt Design . Outracks");
			glRasterPos2f(-.91f,-.9f);
			glCallLists(13,GL_UNSIGNED_BYTE,"Assembly 2009");
			glPopAttrib();
			glDisable(GL_BLEND);
		}*/

// + : + : + : + : + : + : + : + : + : + : + : + : + : + : + : + : + : + : + : +

		// Swap the front and the back buffers.
		SwapBuffers(hContext);

	// Exit on escape.
	if(GetAsyncKeyState(VK_ESCAPE) || dTime >= 148000)
		// Check if we're using ExitProcess().
		#if(dExitProcess)
			ExitProcess(0);
		#else // We're not! Thus simply break the loop.
			return 0;
		#endif // dExitProcess

	goto MainLoop;

	// Hush little compiler don't you cry.
	return 0;
}

