# Re-implementation of Muon Baryon 4k intro in Skulpt/WebGL. Original was
# winner of Assembly 2009 4k compo. See http://pouet.net/prod.php?which=53605
#
# Original notes and copyright at bottom of this file. The C version is very
# complicated in an attempt to crunch things down.
#
# This version unfortunately does not have sound. Interactive sound in HTML5
# et al. are still a total joke as of this writing (Oct 2010).
#
# One amusing note, even though the Python version includes all these
# comments, and the shaders are fully expanded, the gzip'd version is still
# only ~3800 bytes. Not the same as a 4k binary, but still...
#
# Scott Graham, 2010.

import webgl

def main():
    print "Starting up..."
    gl = webgl.Context("canvas")

    # Shader source is vp,fp pairs in Shaders array
    programs = [webgl.Shader(gl, sh[0], sh[1]) for sh in Shaders]

    # This is derived from tricksy code that was intended to save code space I
    # guess. I think there was a small bug as it seems that shader 4 is never
    # used. Perhaps a last minute change or something.
    ShaderOrder = (
        (0, 16000),
        (1, 32000),
        (2, 48000),
        (3, 56000),
        (5, 64000),
        (7, 72000),
        (5, 74160),
        (6, 80000),
        (8, 88000),
        (9, 96000),
        (10, 112000),
        (11, 128000),
        (12, 148000)
        )
    def getProgram(time):
        for pair in ShaderOrder:
            if time < pair[1]:
                return programs[pair[0]]

    def draw(gl, time):
        getProgram(time).use()
        gl.color3ui(time)
        gl.rects(-1, -1, 1, 1)

    gl.setDrawFunc(draw)

# This is all the actual business, everything is really done in the pixel
# shader. These were hackily 'exported' from the original C version (so I
# didn't screw them up!). Unfortunately it means they're not any more readable
# than the C version either.

Shaders = [
[[
"varying float t,er,a1,a2,a3,o1,o2,r1;varying vec3 h1,h2,h3,lv,e;void main(){t=gl_Color.x*4294967.295;h1=vec3(1);h2=vec3(1.,.6,.06);h3=vec3(.5,.75,1.);lv=vec3(200);a3=r1=0.;"+
"e=vec3(0,.7,-3);er=0.;float t2=t+min(float(int(t/16.)),2.)*2.;a1=a2=a3=0.;"+
"e.x=(t-8.)*.26;"+
"e-=vec3(sin(a2)*er,0,cos(a2)*er);gl_Position=ftransform();}"
],
[
"varying float t,er,a1,a2,a3,r1;float cm=1.,i,b=0.,k=1.,rr=0.;varying vec3 h1,h2,h3,lv,e;vec3 h;float n1(vec3 p){p.x+=p.y*57.+p.z*21.;return cos(p.x*sin(p.x));}float n2(vec3 p){vec3 a=floor(p),b=p-a;return mix(mix(mix(n1(a),n1(a+vec3(1,0,0)),b.x),mix(n1(a+vec3(0,1,0)),n1(a+vec3(1,1,0)),b.x),b.y),mix(mix(n1(a+vec3(0,0,1)),n1(a+vec3(1,0,1)),b.x),mix(n1(a+vec3(0,1,1)),n1(a+1.),b.x),b.y),b.z)*.5+.5;}float pn(vec3 p){return n2(p*.06125)*.5+n2(p*.125)*.25+n2(p*.25)*.125;}float o(vec3 p){"+
"if(t>=48.&&t<128.)p.y+=(t-48.)*2.;return p.y+sin(p.x*.5)*sin(sin(p.z*.5)*2.+t*.4)*.4;"+
"}float oo(vec3 p){"+
"float s=0.,a;a=sin(sin(t*.1));vec3 y=vec3(sin(t*.2),sin(t*.3),sin(t*.4))*.6;if(t>=32.){if((abs(p.x)>4.||abs(p.z)>4.)){p.y+=(t-32.)*.3;}else{s=min((t-32.)/14.,1.);}a*=1.-s;y*=1.-s*s;}p=vec3(mod(p.x+4.,8.)-4.,p.y,mod(p.z+4.,8.)-4.);p=vec3(p.x*cos(a)+p.z*sin(a),p.y,p.z*cos(a)-p.x*sin(a));a*=2.;p=vec3(p.x,p.y*cos(a)+p.z*sin(a),p.z*cos(a)-p.y*sin(a));vec3 x=fract(p)-.5;p+=y;return min(max(abs(p.x)-s*2.,max(abs(p.y)-s*2.,abs(p.z)-s*2.)),max(length(p)-2.,max(abs(x.x)-.4,max(abs(x.y)-.4,abs(x.z)-.4))));"+
"}float q(vec3 p){"+
"return 1.;"+
"}float qq(vec3 p){"+
"return .6+.4*sin(p.y*.1+20.*pn(p*100.));"+
"}float ooo(vec3 p){float d,d2;d=o(p);d2=oo(p);if(d<d2){k=q(p);b=0.;h=h1;rr=r1;}else{d=d2;k=1.;b=qq(p)*.03;h=h2;rr=1.;}return d;}void main(){float g=0.,d,w=0.;vec3 v=normalize(vec3((gl_FragCoord.xy-vec2(320,240))/480.*1.4,1));v=vec3(v.x,v.y*cos(a1)+v.z*sin(a1),v.z*cos(a1)-v.y*sin(a1));v=vec3(v.x*cos(a3)+v.y*sin(a3),v.y*cos(a3)-v.x*sin(a3),v.z);v=vec3(v.x*cos(a2)+v.z*sin(a2),v.y,v.z*cos(a2)-v.x*sin(a2));vec3 n,r,p=e,c=(h3+.2)*pow(1.-abs(v.y),2.)+(1.-pow(min(pn(v*220.-vec3(0,t*1.3,0))+.6,1.),8.))*pow(max(v.y,0.),2.)*.5+vec3(1,.7,.4)*pow(max(dot(v,normalize(lv))*1.01,0.),105.),c2;if(t>=128.)c=c*.2+max(pow(min(pn(v*200.+t*5.)*1.5,1.),15.)-pn(v*1200.),0.)*min((t-128.)/5.,1.);while(g<1.){g=length(p-e)/20.;d=ooo(p);if(d<=0.001){vec3 l=normalize(lv-p+e);n=normalize(vec3(ooo(p+vec3(.01,0,0))-d,ooo(p+vec3(0,.01,0))-d,ooo(p+vec3(0,0,.01))-d))+b;r=reflect(l,n);if(cm==1.)c*=g;c2=((1.-g)*k*h*(max(dot(n,l),0.)+pow(max(dot(r,v),0.),17.)))*cm;for(i=1.;i<5.;i++)c2-=vec3((i*.2-ooo(p+n*i*.2))/pow(2.,i));c+=max(c2,0.);if (rr>0.&&w++<1.) {cm*=.5;p-=v*(d+.2);v=reflect(v,n);} else {break;}}p+=v*max(d,.002);}c*=min(t*.0625,1.);if(t>=92.&&t<96.)c*=1.-pow(min((t-92.)/4.,1.),2.);if(t>=96.)c*=min((t-96.)/5.,1.);if(t>=140.)c*=1.-min((t-140.)/8.,1.);c*=1.-.85*length(gl_FragCoord.xy-vec2(320,240))/480.;gl_FragColor=vec4(c,1);}"
]],
[[
"varying float t,er,a1,a2,a3,o1,o2,r1;varying vec3 h1,h2,h3,lv,e;void main(){t=gl_Color.x*4294967.295;h1=vec3(1);h2=vec3(1.,.6,.06);h3=vec3(.5,.75,1.);lv=vec3(200);a3=r1=0.;"+
"e=vec3(0,.7,-3);er=0.;float t2=t+min(float(int(t/16.)),2.)*2.;a1=a2=a3=0.;"+
"e.y+=(t-16.)*.03;a3=sin(t2*.3)*.1;"+
"e-=vec3(sin(a2)*er,0,cos(a2)*er);gl_Position=ftransform();}"
],
[
"varying float t,er,a1,a2,a3,r1;float cm=1.,i,b=0.,k=1.,rr=0.;varying vec3 h1,h2,h3,lv,e;vec3 h;float n1(vec3 p){p.x+=p.y*57.+p.z*21.;return cos(p.x*sin(p.x));}float n2(vec3 p){vec3 a=floor(p),b=p-a;return mix(mix(mix(n1(a),n1(a+vec3(1,0,0)),b.x),mix(n1(a+vec3(0,1,0)),n1(a+vec3(1,1,0)),b.x),b.y),mix(mix(n1(a+vec3(0,0,1)),n1(a+vec3(1,0,1)),b.x),mix(n1(a+vec3(0,1,1)),n1(a+1.),b.x),b.y),b.z)*.5+.5;}float pn(vec3 p){return n2(p*.06125)*.5+n2(p*.125)*.25+n2(p*.25)*.125;}float o(vec3 p){"+
"if(t>=48.&&t<128.)p.y+=(t-48.)*2.;return p.y+sin(p.x*.5)*sin(sin(p.z*.5)*2.+t*.4)*.4;"+
"}float oo(vec3 p){"+
"float s=0.,a;a=sin(sin(t*.1));vec3 y=vec3(sin(t*.2),sin(t*.3),sin(t*.4))*.6;if(t>=32.){if((abs(p.x)>4.||abs(p.z)>4.)){p.y+=(t-32.)*.3;}else{s=min((t-32.)/14.,1.);}a*=1.-s;y*=1.-s*s;}p=vec3(mod(p.x+4.,8.)-4.,p.y,mod(p.z+4.,8.)-4.);p=vec3(p.x*cos(a)+p.z*sin(a),p.y,p.z*cos(a)-p.x*sin(a));a*=2.;p=vec3(p.x,p.y*cos(a)+p.z*sin(a),p.z*cos(a)-p.y*sin(a));vec3 x=fract(p)-.5;p+=y;return min(max(abs(p.x)-s*2.,max(abs(p.y)-s*2.,abs(p.z)-s*2.)),max(length(p)-2.,max(abs(x.x)-.4,max(abs(x.y)-.4,abs(x.z)-.4))));"+
"}float q(vec3 p){"+
"return 1.;"+
"}float qq(vec3 p){"+
"return .6+.4*sin(p.y*.1+20.*pn(p*100.));"+
"}float ooo(vec3 p){float d,d2;d=o(p);d2=oo(p);if(d<d2){k=q(p);b=0.;h=h1;rr=r1;}else{d=d2;k=1.;b=qq(p)*.03;h=h2;rr=1.;}return d;}void main(){float g=0.,d,w=0.;vec3 v=normalize(vec3((gl_FragCoord.xy-vec2(320,240))/480.*1.4,1));v=vec3(v.x,v.y*cos(a1)+v.z*sin(a1),v.z*cos(a1)-v.y*sin(a1));v=vec3(v.x*cos(a3)+v.y*sin(a3),v.y*cos(a3)-v.x*sin(a3),v.z);v=vec3(v.x*cos(a2)+v.z*sin(a2),v.y,v.z*cos(a2)-v.x*sin(a2));vec3 n,r,p=e,c=(h3+.2)*pow(1.-abs(v.y),2.)+(1.-pow(min(pn(v*220.-vec3(0,t*1.3,0))+.6,1.),8.))*pow(max(v.y,0.),2.)*.5+vec3(1,.7,.4)*pow(max(dot(v,normalize(lv))*1.01,0.),105.),c2;if(t>=128.)c=c*.2+max(pow(min(pn(v*200.+t*5.)*1.5,1.),15.)-pn(v*1200.),0.)*min((t-128.)/5.,1.);while(g<1.){g=length(p-e)/20.;d=ooo(p);if(d<=0.001){vec3 l=normalize(lv-p+e);n=normalize(vec3(ooo(p+vec3(.01,0,0))-d,ooo(p+vec3(0,.01,0))-d,ooo(p+vec3(0,0,.01))-d))+b;r=reflect(l,n);if(cm==1.)c*=g;c2=((1.-g)*k*h*(max(dot(n,l),0.)+pow(max(dot(r,v),0.),17.)))*cm;for(i=1.;i<5.;i++)c2-=vec3((i*.2-ooo(p+n*i*.2))/pow(2.,i));c+=max(c2,0.);if (rr>0.&&w++<1.) {cm*=.5;p-=v*(d+.2);v=reflect(v,n);} else {break;}}p+=v*max(d,.002);}c*=min(t*.0625,1.);if(t>=92.&&t<96.)c*=1.-pow(min((t-92.)/4.,1.),2.);if(t>=96.)c*=min((t-96.)/5.,1.);if(t>=140.)c*=1.-min((t-140.)/8.,1.);c*=1.-.85*length(gl_FragCoord.xy-vec2(320,240))/480.;gl_FragColor=vec4(c,1);}"
]],
[[
"varying float t,er,a1,a2,a3,o1,o2,r1;varying vec3 h1,h2,h3,lv,e;void main(){t=gl_Color.x*4294967.295;h1=vec3(1);h2=vec3(1.,.6,.06);h3=vec3(.5,.75,1.);lv=vec3(200);a3=r1=0.;"+
"e=vec3(0,.7,-3);er=0.;float t2=t+min(float(int(t/16.)),2.)*2.;a1=a2=a3=0.;"+
"e=vec3(0,5,0);er=sin(t2*.1)*2.+7.;a1-=.3;a2=sin(t2*.1)*1.2;er+=(t-32.)*.3;"+
"e-=vec3(sin(a2)*er,0,cos(a2)*er);gl_Position=ftransform();}"
],
[
"varying float t,er,a1,a2,a3,r1;float cm=1.,i,b=0.,k=1.,rr=0.;varying vec3 h1,h2,h3,lv,e;vec3 h;float n1(vec3 p){p.x+=p.y*57.+p.z*21.;return cos(p.x*sin(p.x));}float n2(vec3 p){vec3 a=floor(p),b=p-a;return mix(mix(mix(n1(a),n1(a+vec3(1,0,0)),b.x),mix(n1(a+vec3(0,1,0)),n1(a+vec3(1,1,0)),b.x),b.y),mix(mix(n1(a+vec3(0,0,1)),n1(a+vec3(1,0,1)),b.x),mix(n1(a+vec3(0,1,1)),n1(a+1.),b.x),b.y),b.z)*.5+.5;}float pn(vec3 p){return n2(p*.06125)*.5+n2(p*.125)*.25+n2(p*.25)*.125;}float o(vec3 p){"+
"if(t>=48.&&t<128.)p.y+=(t-48.)*2.;return p.y+sin(p.x*.5)*sin(sin(p.z*.5)*2.+t*.4)*.4;"+
"}float oo(vec3 p){"+
"float s=0.,a;a=sin(sin(t*.1));vec3 y=vec3(sin(t*.2),sin(t*.3),sin(t*.4))*.6;if(t>=32.){if((abs(p.x)>4.||abs(p.z)>4.)){p.y+=(t-32.)*.3;}else{s=min((t-32.)/14.,1.);}a*=1.-s;y*=1.-s*s;}p=vec3(mod(p.x+4.,8.)-4.,p.y,mod(p.z+4.,8.)-4.);p=vec3(p.x*cos(a)+p.z*sin(a),p.y,p.z*cos(a)-p.x*sin(a));a*=2.;p=vec3(p.x,p.y*cos(a)+p.z*sin(a),p.z*cos(a)-p.y*sin(a));vec3 x=fract(p)-.5;p+=y;return min(max(abs(p.x)-s*2.,max(abs(p.y)-s*2.,abs(p.z)-s*2.)),max(length(p)-2.,max(abs(x.x)-.4,max(abs(x.y)-.4,abs(x.z)-.4))));"+
"}float q(vec3 p){"+
"return 1.;"+
"}float qq(vec3 p){"+
"return .6+.4*sin(p.y*.1+20.*pn(p*100.));"+
"}float ooo(vec3 p){float d,d2;d=o(p);d2=oo(p);if(d<d2){k=q(p);b=0.;h=h1;rr=r1;}else{d=d2;k=1.;b=qq(p)*.03;h=h2;rr=1.;}return d;}void main(){float g=0.,d,w=0.;vec3 v=normalize(vec3((gl_FragCoord.xy-vec2(320,240))/480.*1.4,1));v=vec3(v.x,v.y*cos(a1)+v.z*sin(a1),v.z*cos(a1)-v.y*sin(a1));v=vec3(v.x*cos(a3)+v.y*sin(a3),v.y*cos(a3)-v.x*sin(a3),v.z);v=vec3(v.x*cos(a2)+v.z*sin(a2),v.y,v.z*cos(a2)-v.x*sin(a2));vec3 n,r,p=e,c=(h3+.2)*pow(1.-abs(v.y),2.)+(1.-pow(min(pn(v*220.-vec3(0,t*1.3,0))+.6,1.),8.))*pow(max(v.y,0.),2.)*.5+vec3(1,.7,.4)*pow(max(dot(v,normalize(lv))*1.01,0.),105.),c2;if(t>=128.)c=c*.2+max(pow(min(pn(v*200.+t*5.)*1.5,1.),15.)-pn(v*1200.),0.)*min((t-128.)/5.,1.);while(g<1.){g=length(p-e)/20.;d=ooo(p);if(d<=0.001){vec3 l=normalize(lv-p+e);n=normalize(vec3(ooo(p+vec3(.01,0,0))-d,ooo(p+vec3(0,.01,0))-d,ooo(p+vec3(0,0,.01))-d))+b;r=reflect(l,n);if(cm==1.)c*=g;c2=((1.-g)*k*h*(max(dot(n,l),0.)+pow(max(dot(r,v),0.),17.)))*cm;for(i=1.;i<5.;i++)c2-=vec3((i*.2-ooo(p+n*i*.2))/pow(2.,i));c+=max(c2,0.);if (rr>0.&&w++<1.) {cm*=.5;p-=v*(d+.2);v=reflect(v,n);} else {break;}}p+=v*max(d,.002);}c*=min(t*.0625,1.);if(t>=92.&&t<96.)c*=1.-pow(min((t-92.)/4.,1.),2.);if(t>=96.)c*=min((t-96.)/5.,1.);if(t>=140.)c*=1.-min((t-140.)/8.,1.);c*=1.-.85*length(gl_FragCoord.xy-vec2(320,240))/480.;gl_FragColor=vec4(c,1);}"
]],
[[
"varying float t,er,a1,a2,a3,o1,o2,r1;varying vec3 h1,h2,h3,lv,e;void main(){t=gl_Color.x*4294967.295;h1=vec3(1);h2=vec3(1.,.6,.06);h3=vec3(.5,.75,1.);lv=vec3(200);a3=r1=0.;"+
"e=vec3(0,4,0);er=sin(t*.5)+3.02;a1=sin(t)*.1-.9;a2=sin(t*.2)*2.;a3=sin(t*.7)*.1;"+
"e-=vec3(sin(a2)*er,0,cos(a2)*er);gl_Position=ftransform();}"
],
[
"varying float t,er,a1,a2,a3,r1;float cm=1.,i,b=0.,k=1.,rr=0.;varying vec3 h1,h2,h3,lv,e;vec3 h;float n1(vec3 p){p.x+=p.y*57.+p.z*21.;return cos(p.x*sin(p.x));}float n2(vec3 p){vec3 a=floor(p),b=p-a;return mix(mix(mix(n1(a),n1(a+vec3(1,0,0)),b.x),mix(n1(a+vec3(0,1,0)),n1(a+vec3(1,1,0)),b.x),b.y),mix(mix(n1(a+vec3(0,0,1)),n1(a+vec3(1,0,1)),b.x),mix(n1(a+vec3(0,1,1)),n1(a+1.),b.x),b.y),b.z)*.5+.5;}float pn(vec3 p){return n2(p*.06125)*.5+n2(p*.125)*.25+n2(p*.25)*.125;}float o(vec3 p){"+
"if(t>=48.&&t<128.)p.y+=(t-48.)*2.;return p.y+sin(p.x*.5)*sin(sin(p.z*.5)*2.+t*.4)*.4;"+
"}float oo(vec3 p){"+
"return max(-p.y-16.+15.*(1.-pow(max(min(1.-(t-64.)/7.,1.),0.),2.)),max(abs(p.x+sin(p.y*1.5+t*2.)*.15)-1.,max(p.y-1.,abs(p.z+sin(p.y*1.3+t*2.)*.15)-1.)));"+
"}float q(vec3 p){"+
"return 1.;"+
"}float qq(vec3 p){"+
"return .6+.4*sin(p.y*.1+20.*pn(p*100.));"+
"}float ooo(vec3 p){float d,d2;d=o(p);d2=oo(p);if(d<d2){k=q(p);b=0.;h=h1;rr=r1;}else{d=d2;k=1.;b=qq(p)*.03;h=h2;rr=1.;}return d;}void main(){float g=0.,d,w=0.;vec3 v=normalize(vec3((gl_FragCoord.xy-vec2(320,240))/480.*1.4,1));v=vec3(v.x,v.y*cos(a1)+v.z*sin(a1),v.z*cos(a1)-v.y*sin(a1));v=vec3(v.x*cos(a3)+v.y*sin(a3),v.y*cos(a3)-v.x*sin(a3),v.z);v=vec3(v.x*cos(a2)+v.z*sin(a2),v.y,v.z*cos(a2)-v.x*sin(a2));vec3 n,r,p=e,c=(h3+.2)*pow(1.-abs(v.y),2.)+(1.-pow(min(pn(v*220.-vec3(0,t*1.3,0))+.6,1.),8.))*pow(max(v.y,0.),2.)*.5+vec3(1,.7,.4)*pow(max(dot(v,normalize(lv))*1.01,0.),105.),c2;if(t>=128.)c=c*.2+max(pow(min(pn(v*200.+t*5.)*1.5,1.),15.)-pn(v*1200.),0.)*min((t-128.)/5.,1.);while(g<1.){g=length(p-e)/20.;d=ooo(p);if(d<=0.001){vec3 l=normalize(lv-p+e);n=normalize(vec3(ooo(p+vec3(.01,0,0))-d,ooo(p+vec3(0,.01,0))-d,ooo(p+vec3(0,0,.01))-d))+b;r=reflect(l,n);if(cm==1.)c*=g;c2=((1.-g)*k*h*(max(dot(n,l),0.)+pow(max(dot(r,v),0.),17.)))*cm;for(i=1.;i<5.;i++)c2-=vec3((i*.2-ooo(p+n*i*.2))/pow(2.,i));c+=max(c2,0.);if (rr>0.&&w++<1.) {cm*=.5;p-=v*(d+.2);v=reflect(v,n);} else {break;}}p+=v*max(d,.002);}c*=min(t*.0625,1.);if(t>=92.&&t<96.)c*=1.-pow(min((t-92.)/4.,1.),2.);if(t>=96.)c*=min((t-96.)/5.,1.);if(t>=140.)c*=1.-min((t-140.)/8.,1.);c*=1.-.85*length(gl_FragCoord.xy-vec2(320,240))/480.;gl_FragColor=vec4(c,1);}"
]],
[[
"varying float t,er,a1,a2,a3,o1,o2,r1;varying vec3 h1,h2,h3,lv,e;void main(){t=gl_Color.x*4294967.295;h1=vec3(1);h2=vec3(1.,.6,.06);h3=vec3(.5,.75,1.);lv=vec3(200);a3=r1=0.;"+
"e=vec3(0,4,0);er=sin(t*.5)+3.02;a1=sin(t)*.1-.9;a2=sin(t*.2)*2.;a3=sin(t*.7)*.1;"+
"e=vec3(0);"+
"a1=sin(t*.8)*.2;"+
"a2-=.6;"+
"e-=vec3(sin(a2)*er,0,cos(a2)*er);gl_Position=ftransform();}"
],
[
"varying float t,er,a1,a2,a3,r1;float cm=1.,i,b=0.,k=1.,rr=0.;varying vec3 h1,h2,h3,lv,e;vec3 h;float n1(vec3 p){p.x+=p.y*57.+p.z*21.;return cos(p.x*sin(p.x));}float n2(vec3 p){vec3 a=floor(p),b=p-a;return mix(mix(mix(n1(a),n1(a+vec3(1,0,0)),b.x),mix(n1(a+vec3(0,1,0)),n1(a+vec3(1,1,0)),b.x),b.y),mix(mix(n1(a+vec3(0,0,1)),n1(a+vec3(1,0,1)),b.x),mix(n1(a+vec3(0,1,1)),n1(a+1.),b.x),b.y),b.z)*.5+.5;}float pn(vec3 p){return n2(p*.06125)*.5+n2(p*.125)*.25+n2(p*.25)*.125;}float o(vec3 p){"+
"if(t>=48.&&t<128.)p.y+=(t-48.)*2.;return p.y+sin(p.x*.5)*sin(sin(p.z*.5)*2.+t*.4)*.4;"+
"}float oo(vec3 p){"+
"return max(-p.y-16.+15.*(1.-pow(max(min(1.-(t-64.)/7.,1.),0.),2.)),max(abs(p.x+sin(p.y*1.5+t*2.)*.15)-1.,max(p.y-1.,abs(p.z+sin(p.y*1.3+t*2.)*.15)-1.)));"+
"}float q(vec3 p){"+
"return 1.;"+
"}float qq(vec3 p){"+
"return .6+.4*sin(p.y*.1+20.*pn(p*100.));"+
"}float ooo(vec3 p){float d,d2;d=o(p);d2=oo(p);if(d<d2){k=q(p);b=0.;h=h1;rr=r1;}else{d=d2;k=1.;b=qq(p)*.03;h=h2;rr=1.;}return d;}void main(){float g=0.,d,w=0.;vec3 v=normalize(vec3((gl_FragCoord.xy-vec2(320,240))/480.*1.4,1));v=vec3(v.x,v.y*cos(a1)+v.z*sin(a1),v.z*cos(a1)-v.y*sin(a1));v=vec3(v.x*cos(a3)+v.y*sin(a3),v.y*cos(a3)-v.x*sin(a3),v.z);v=vec3(v.x*cos(a2)+v.z*sin(a2),v.y,v.z*cos(a2)-v.x*sin(a2));vec3 n,r,p=e,c=(h3+.2)*pow(1.-abs(v.y),2.)+(1.-pow(min(pn(v*220.-vec3(0,t*1.3,0))+.6,1.),8.))*pow(max(v.y,0.),2.)*.5+vec3(1,.7,.4)*pow(max(dot(v,normalize(lv))*1.01,0.),105.),c2;if(t>=128.)c=c*.2+max(pow(min(pn(v*200.+t*5.)*1.5,1.),15.)-pn(v*1200.),0.)*min((t-128.)/5.,1.);while(g<1.){g=length(p-e)/20.;d=ooo(p);if(d<=0.001){vec3 l=normalize(lv-p+e);n=normalize(vec3(ooo(p+vec3(.01,0,0))-d,ooo(p+vec3(0,.01,0))-d,ooo(p+vec3(0,0,.01))-d))+b;r=reflect(l,n);if(cm==1.)c*=g;c2=((1.-g)*k*h*(max(dot(n,l),0.)+pow(max(dot(r,v),0.),17.)))*cm;for(i=1.;i<5.;i++)c2-=vec3((i*.2-ooo(p+n*i*.2))/pow(2.,i));c+=max(c2,0.);if (rr>0.&&w++<1.) {cm*=.5;p-=v*(d+.2);v=reflect(v,n);} else {break;}}p+=v*max(d,.002);}c*=min(t*.0625,1.);if(t>=92.&&t<96.)c*=1.-pow(min((t-92.)/4.,1.),2.);if(t>=96.)c*=min((t-96.)/5.,1.);if(t>=140.)c*=1.-min((t-140.)/8.,1.);c*=1.-.85*length(gl_FragCoord.xy-vec2(320,240))/480.;gl_FragColor=vec4(c,1);}"
]],
[[
"varying float t,er,a1,a2,a3,o1,o2,r1;varying vec3 h1,h2,h3,lv,e;void main(){t=gl_Color.x*4294967.295;h1=vec3(1);h2=vec3(1.,.6,.06);h3=vec3(.5,.75,1.);lv=vec3(200);a3=r1=0.;"+
"e=vec3(0,4,0);er=sin(t*.5)+3.02;a1=sin(t)*.1-.9;a2=sin(t*.2)*2.;a3=sin(t*.7)*.1;"+
"e=vec3(0);"+
"e.y+=(t-72.)*.2;er+=max((t-72.)*.4,0.);r1=1.;"+
"a1=sin(t*.8)*.2;"+
"a2-=.6;"+
"e-=vec3(sin(a2)*er,0,cos(a2)*er);gl_Position=ftransform();}"
],
[
"varying float t,er,a1,a2,a3,r1;float cm=1.,i,b=0.,k=1.,rr=0.;varying vec3 h1,h2,h3,lv,e;vec3 h;float n1(vec3 p){p.x+=p.y*57.+p.z*21.;return cos(p.x*sin(p.x));}float n2(vec3 p){vec3 a=floor(p),b=p-a;return mix(mix(mix(n1(a),n1(a+vec3(1,0,0)),b.x),mix(n1(a+vec3(0,1,0)),n1(a+vec3(1,1,0)),b.x),b.y),mix(mix(n1(a+vec3(0,0,1)),n1(a+vec3(1,0,1)),b.x),mix(n1(a+vec3(0,1,1)),n1(a+1.),b.x),b.y),b.z)*.5+.5;}float pn(vec3 p){return n2(p*.06125)*.5+n2(p*.125)*.25+n2(p*.25)*.125;}float o(vec3 p){"+
"float s=0.,a;p=vec3(fract(p.x*.25+.5)*4.-2.,p.y+sin(p.x*.5)*sin(sin(p.z*.5)*2.+t)*.6,fract(p.z*.25+.5)*4.-2.);s=1.-max(77.-t,0.);return max(abs(length(p.xz)-2.)-.3,abs(p.y+3.+(1.-s*s)*1.6)-.3);"+
"}float oo(vec3 p){"+
"return max(-p.y-16.+15.*(1.-pow(max(min(1.-(t-64.)/7.,1.),0.),2.)),max(abs(p.x+sin(p.y*1.5+t*2.)*.15)-1.,max(p.y-1.,abs(p.z+sin(p.y*1.3+t*2.)*.15)-1.)));"+
"}float q(vec3 p){"+
"return 1.;"+
"}float qq(vec3 p){"+
"return .6+.4*sin(p.y*.1+20.*pn(p*100.));"+
"}float ooo(vec3 p){float d,d2;d=o(p);d2=oo(p);if(d<d2){k=q(p);b=0.;h=h1;rr=r1;}else{d=d2;k=1.;b=qq(p)*.03;h=h2;rr=1.;}return d;}void main(){float g=0.,d,w=0.;vec3 v=normalize(vec3((gl_FragCoord.xy-vec2(320,240))/480.*1.4,1));v=vec3(v.x,v.y*cos(a1)+v.z*sin(a1),v.z*cos(a1)-v.y*sin(a1));v=vec3(v.x*cos(a3)+v.y*sin(a3),v.y*cos(a3)-v.x*sin(a3),v.z);v=vec3(v.x*cos(a2)+v.z*sin(a2),v.y,v.z*cos(a2)-v.x*sin(a2));vec3 n,r,p=e,c=(h3+.2)*pow(1.-abs(v.y),2.)+(1.-pow(min(pn(v*220.-vec3(0,t*1.3,0))+.6,1.),8.))*pow(max(v.y,0.),2.)*.5+vec3(1,.7,.4)*pow(max(dot(v,normalize(lv))*1.01,0.),105.),c2;if(t>=128.)c=c*.2+max(pow(min(pn(v*200.+t*5.)*1.5,1.),15.)-pn(v*1200.),0.)*min((t-128.)/5.,1.);while(g<1.){g=length(p-e)/20.;d=ooo(p);if(d<=0.001){vec3 l=normalize(lv-p+e);n=normalize(vec3(ooo(p+vec3(.01,0,0))-d,ooo(p+vec3(0,.01,0))-d,ooo(p+vec3(0,0,.01))-d))+b;r=reflect(l,n);if(cm==1.)c*=g;c2=((1.-g)*k*h*(max(dot(n,l),0.)+pow(max(dot(r,v),0.),17.)))*cm;for(i=1.;i<5.;i++)c2-=vec3((i*.2-ooo(p+n*i*.2))/pow(2.,i));c+=max(c2,0.);if (rr>0.&&w++<1.) {cm*=.5;p-=v*(d+.2);v=reflect(v,n);} else {break;}}p+=v*max(d,.002);}c*=min(t*.0625,1.);if(t>=92.&&t<96.)c*=1.-pow(min((t-92.)/4.,1.),2.);if(t>=96.)c*=min((t-96.)/5.,1.);if(t>=140.)c*=1.-min((t-140.)/8.,1.);c*=1.-.85*length(gl_FragCoord.xy-vec2(320,240))/480.;gl_FragColor=vec4(c,1);}"
]],
[[
"varying float t,er,a1,a2,a3,o1,o2,r1;varying vec3 h1,h2,h3,lv,e;void main(){t=gl_Color.x*4294967.295;h1=vec3(1);h2=vec3(1.,.6,.06);h3=vec3(.5,.75,1.);lv=vec3(200);a3=r1=0.;"+
"e=vec3(0,4,0);er=sin(t*.5)+3.02;a1=sin(t)*.1-.9;a2=sin(t*.2)*2.;a3=sin(t*.7)*.1;"+
"e=vec3(0);"+
"e.y+=(t-72.)*.2;er+=max((t-72.)*.4,0.);r1=1.;"+
"a1=sin(t*.8)*.2;"+
"a2-=.6;"+
"e-=vec3(sin(a2)*er,0,cos(a2)*er);gl_Position=ftransform();}"
],
[
"varying float t,er,a1,a2,a3,r1;float cm=1.,i,b=0.,k=1.,rr=0.;varying vec3 h1,h2,h3,lv,e;vec3 h;float n1(vec3 p){p.x+=p.y*57.+p.z*21.;return cos(p.x*sin(p.x));}float n2(vec3 p){vec3 a=floor(p),b=p-a;return mix(mix(mix(n1(a),n1(a+vec3(1,0,0)),b.x),mix(n1(a+vec3(0,1,0)),n1(a+vec3(1,1,0)),b.x),b.y),mix(mix(n1(a+vec3(0,0,1)),n1(a+vec3(1,0,1)),b.x),mix(n1(a+vec3(0,1,1)),n1(a+1.),b.x),b.y),b.z)*.5+.5;}float pn(vec3 p){return n2(p*.06125)*.5+n2(p*.125)*.25+n2(p*.25)*.125;}float o(vec3 p){"+
"float s=0.,a;p=vec3(fract(p.x*.25+.5)*4.-2.,p.y+sin(p.x*.5)*sin(sin(p.z*.5)*2.+t)*.6,fract(p.z*.25+.5)*4.-2.);s=1.-max(77.-t,0.);return max(abs(length(p.xz)-2.)-.3,abs(p.y+3.+(1.-s*s)*1.6)-.3);"+
"}float oo(vec3 p){"+
"float s=0.,a;vec3 x=p;p=vec3(fract(p.x*.25+.5)*4.-2.,p.y,fract(p.z*.25+.5)*4.-2.);a=sin(sin(p.y+p.x-x.x+p.z-x.z)+t);p=vec3(p.x*cos(a)+p.z*sin(a),p.y,p.z*cos(a)-p.x*sin(a));p=vec3(p.x*cos(a)+p.y*sin(a),p.y*cos(a)-p.x*sin(a),p.z);return max(max(abs(p.x)-.8,abs(p.y)-.8),abs(p.z)-.8);"+
"}float q(vec3 p){"+
"return 1.;"+
"}float qq(vec3 p){"+
"return pn(p*1000.);"+
"}float ooo(vec3 p){float d,d2;d=o(p);d2=oo(p);if(d<d2){k=q(p);b=0.;h=h1;rr=r1;}else{d=d2;k=1.;b=qq(p)*.03;h=h2;rr=1.;}return d;}void main(){float g=0.,d,w=0.;vec3 v=normalize(vec3((gl_FragCoord.xy-vec2(320,240))/480.*1.4,1));v=vec3(v.x,v.y*cos(a1)+v.z*sin(a1),v.z*cos(a1)-v.y*sin(a1));v=vec3(v.x*cos(a3)+v.y*sin(a3),v.y*cos(a3)-v.x*sin(a3),v.z);v=vec3(v.x*cos(a2)+v.z*sin(a2),v.y,v.z*cos(a2)-v.x*sin(a2));vec3 n,r,p=e,c=(h3+.2)*pow(1.-abs(v.y),2.)+(1.-pow(min(pn(v*220.-vec3(0,t*1.3,0))+.6,1.),8.))*pow(max(v.y,0.),2.)*.5+vec3(1,.7,.4)*pow(max(dot(v,normalize(lv))*1.01,0.),105.),c2;if(t>=128.)c=c*.2+max(pow(min(pn(v*200.+t*5.)*1.5,1.),15.)-pn(v*1200.),0.)*min((t-128.)/5.,1.);while(g<1.){g=length(p-e)/20.;d=ooo(p);if(d<=0.001){vec3 l=normalize(lv-p+e);n=normalize(vec3(ooo(p+vec3(.01,0,0))-d,ooo(p+vec3(0,.01,0))-d,ooo(p+vec3(0,0,.01))-d))+b;r=reflect(l,n);if(cm==1.)c*=g;c2=((1.-g)*k*h*(max(dot(n,l),0.)+pow(max(dot(r,v),0.),17.)))*cm;for(i=1.;i<5.;i++)c2-=vec3((i*.2-ooo(p+n*i*.2))/pow(2.,i));c+=max(c2,0.);if (rr>0.&&w++<1.) {cm*=.5;p-=v*(d+.2);v=reflect(v,n);} else {break;}}p+=v*max(d,.002);}c*=min(t*.0625,1.);if(t>=92.&&t<96.)c*=1.-pow(min((t-92.)/4.,1.),2.);if(t>=96.)c*=min((t-96.)/5.,1.);if(t>=140.)c*=1.-min((t-140.)/8.,1.);c*=1.-.85*length(gl_FragCoord.xy-vec2(320,240))/480.;gl_FragColor=vec4(c,1);}"
]],
[[
"varying float t,er,a1,a2,a3,o1,o2,r1;varying vec3 h1,h2,h3,lv,e;void main(){t=gl_Color.x*4294967.295;h1=vec3(1);h2=vec3(1.,.6,.06);h3=vec3(.5,.75,1.);lv=vec3(200);a3=r1=0.;"+
"e=vec3(0,4,0);er=sin(t*.5)+3.02;a1=sin(t)*.1-.9;a2=sin(t*.2)*2.;a3=sin(t*.7)*.1;"+
"e=vec3(0);"+
"a1=sin(t*.8)*.2;"+
"er+=2.;a1-=.3;a2=sin(t*.14)*-2.;"+
"a2-=.6;"+
"e-=vec3(sin(a2)*er,0,cos(a2)*er);gl_Position=ftransform();}"
],
[
"varying float t,er,a1,a2,a3,r1;float cm=1.,i,b=0.,k=1.,rr=0.;varying vec3 h1,h2,h3,lv,e;vec3 h;float n1(vec3 p){p.x+=p.y*57.+p.z*21.;return cos(p.x*sin(p.x));}float n2(vec3 p){vec3 a=floor(p),b=p-a;return mix(mix(mix(n1(a),n1(a+vec3(1,0,0)),b.x),mix(n1(a+vec3(0,1,0)),n1(a+vec3(1,1,0)),b.x),b.y),mix(mix(n1(a+vec3(0,0,1)),n1(a+vec3(1,0,1)),b.x),mix(n1(a+vec3(0,1,1)),n1(a+1.),b.x),b.y),b.z)*.5+.5;}float pn(vec3 p){return n2(p*.06125)*.5+n2(p*.125)*.25+n2(p*.25)*.125;}float o(vec3 p){"+
"if(t>=48.&&t<128.)p.y+=(t-48.)*2.;return p.y+sin(p.x*.5)*sin(sin(p.z*.5)*2.+t*.4)*.4;"+
"}float oo(vec3 p){"+
"return max(-p.y-16.+15.*(1.-pow(max(min(1.-(t-64.)/7.,1.),0.),2.)),max(abs(p.x+sin(p.y*1.5+t*2.)*.15)-1.,max(p.y-1.,abs(p.z+sin(p.y*1.3+t*2.)*.15)-1.)));"+
"}float q(vec3 p){"+
"return 1.;"+
"}float qq(vec3 p){"+
"return .6+.4*sin(p.y*.1+20.*pn(p*100.));"+
"}float ooo(vec3 p){float d,d2;d=o(p);d2=oo(p);if(d<d2){k=q(p);b=0.;h=h1;rr=r1;}else{d=d2;k=1.;b=qq(p)*.03;h=h2;rr=1.;}return d;}void main(){float g=0.,d,w=0.;vec3 v=normalize(vec3((gl_FragCoord.xy-vec2(320,240))/480.*1.4,1));v=vec3(v.x,v.y*cos(a1)+v.z*sin(a1),v.z*cos(a1)-v.y*sin(a1));v=vec3(v.x*cos(a3)+v.y*sin(a3),v.y*cos(a3)-v.x*sin(a3),v.z);v=vec3(v.x*cos(a2)+v.z*sin(a2),v.y,v.z*cos(a2)-v.x*sin(a2));vec3 n,r,p=e,c=(h3+.2)*pow(1.-abs(v.y),2.)+(1.-pow(min(pn(v*220.-vec3(0,t*1.3,0))+.6,1.),8.))*pow(max(v.y,0.),2.)*.5+vec3(1,.7,.4)*pow(max(dot(v,normalize(lv))*1.01,0.),105.),c2;if(t>=128.)c=c*.2+max(pow(min(pn(v*200.+t*5.)*1.5,1.),15.)-pn(v*1200.),0.)*min((t-128.)/5.,1.);while(g<1.){g=length(p-e)/20.;d=ooo(p);if(d<=0.001){vec3 l=normalize(lv-p+e);n=normalize(vec3(ooo(p+vec3(.01,0,0))-d,ooo(p+vec3(0,.01,0))-d,ooo(p+vec3(0,0,.01))-d))+b;r=reflect(l,n);if(cm==1.)c*=g;c2=((1.-g)*k*h*(max(dot(n,l),0.)+pow(max(dot(r,v),0.),17.)))*cm;for(i=1.;i<5.;i++)c2-=vec3((i*.2-ooo(p+n*i*.2))/pow(2.,i));c+=max(c2,0.);if (rr>0.&&w++<1.) {cm*=.5;p-=v*(d+.2);v=reflect(v,n);} else {break;}}p+=v*max(d,.002);}c*=min(t*.0625,1.);if(t>=92.&&t<96.)c*=1.-pow(min((t-92.)/4.,1.),2.);if(t>=96.)c*=min((t-96.)/5.,1.);if(t>=140.)c*=1.-min((t-140.)/8.,1.);c*=1.-.85*length(gl_FragCoord.xy-vec2(320,240))/480.;gl_FragColor=vec4(c,1);}"
]],
[[
"varying float t,er,a1,a2,a3,o1,o2,r1;varying vec3 h1,h2,h3,lv,e;void main(){t=gl_Color.x*4294967.295;h1=vec3(1);h2=vec3(1.,.6,.06);h3=vec3(.5,.75,1.);lv=vec3(200);a3=r1=0.;"+
"e=vec3(0,4,0);er=sin(t*.5)+3.02;a1=sin(t)*.1-.9;a2=sin(t*.2)*2.;a3=sin(t*.7)*.1;"+
"e=vec3(0);"+
"e.y+=(t-72.)*.2;er+=max((t-72.)*.4,0.);r1=1.;"+
"a1=sin(t*.8)*.2;"+
"a2-=.6;"+
"lv=vec3(0,160.-(t-80.)*17.,200);e.z+=t*2.;a1*=.5;a2*=.4;a2+=.6;"+
"e-=vec3(sin(a2)*er,0,cos(a2)*er);gl_Position=ftransform();}"
],
[
"varying float t,er,a1,a2,a3,r1;float cm=1.,i,b=0.,k=1.,rr=0.;varying vec3 h1,h2,h3,lv,e;vec3 h;float n1(vec3 p){p.x+=p.y*57.+p.z*21.;return cos(p.x*sin(p.x));}float n2(vec3 p){vec3 a=floor(p),b=p-a;return mix(mix(mix(n1(a),n1(a+vec3(1,0,0)),b.x),mix(n1(a+vec3(0,1,0)),n1(a+vec3(1,1,0)),b.x),b.y),mix(mix(n1(a+vec3(0,0,1)),n1(a+vec3(1,0,1)),b.x),mix(n1(a+vec3(0,1,1)),n1(a+1.),b.x),b.y),b.z)*.5+.5;}float pn(vec3 p){return n2(p*.06125)*.5+n2(p*.125)*.25+n2(p*.25)*.125;}float o(vec3 p){"+
"float s=0.,a;p=vec3(fract(p.x*.25+.5)*4.-2.,p.y+sin(p.x*.5)*sin(sin(p.z*.5)*2.+t)*.6,fract(p.z*.25+.5)*4.-2.);s=1.-max(77.-t,0.);return max(abs(length(p.xz)-2.)-.3,abs(p.y+3.+(1.-s*s)*1.6)-.3);"+
"}float oo(vec3 p){"+
"float s=0.,a;vec3 x=p;p=vec3(fract(p.x*.25+.5)*4.-2.,p.y,fract(p.z*.25+.5)*4.-2.);a=sin(sin(p.y+p.x-x.x+p.z-x.z)+t);p=vec3(p.x*cos(a)+p.z*sin(a),p.y,p.z*cos(a)-p.x*sin(a));p=vec3(p.x*cos(a)+p.y*sin(a),p.y*cos(a)-p.x*sin(a),p.z);return max(max(abs(p.x)-.8,abs(p.y)-.8),abs(p.z)-.8);"+
"}float q(vec3 p){"+
"return 1.;"+
"}float qq(vec3 p){"+
"return pn(p*1000.);"+
"}float ooo(vec3 p){float d,d2;d=o(p);d2=oo(p);if(d<d2){k=q(p);b=0.;h=h1;rr=r1;}else{d=d2;k=1.;b=qq(p)*.03;h=h2;rr=1.;}return d;}void main(){float g=0.,d,w=0.;vec3 v=normalize(vec3((gl_FragCoord.xy-vec2(320,240))/480.*1.4,1));v=vec3(v.x,v.y*cos(a1)+v.z*sin(a1),v.z*cos(a1)-v.y*sin(a1));v=vec3(v.x*cos(a3)+v.y*sin(a3),v.y*cos(a3)-v.x*sin(a3),v.z);v=vec3(v.x*cos(a2)+v.z*sin(a2),v.y,v.z*cos(a2)-v.x*sin(a2));vec3 n,r,p=e,c=(h3+.2)*pow(1.-abs(v.y),2.)+(1.-pow(min(pn(v*220.-vec3(0,t*1.3,0))+.6,1.),8.))*pow(max(v.y,0.),2.)*.5+vec3(1,.7,.4)*pow(max(dot(v,normalize(lv))*1.01,0.),105.),c2;if(t>=128.)c=c*.2+max(pow(min(pn(v*200.+t*5.)*1.5,1.),15.)-pn(v*1200.),0.)*min((t-128.)/5.,1.);while(g<1.){g=length(p-e)/20.;d=ooo(p);if(d<=0.001){vec3 l=normalize(lv-p+e);n=normalize(vec3(ooo(p+vec3(.01,0,0))-d,ooo(p+vec3(0,.01,0))-d,ooo(p+vec3(0,0,.01))-d))+b;r=reflect(l,n);if(cm==1.)c*=g;c2=((1.-g)*k*h*(max(dot(n,l),0.)+pow(max(dot(r,v),0.),17.)))*cm;for(i=1.;i<5.;i++)c2-=vec3((i*.2-ooo(p+n*i*.2))/pow(2.,i));c+=max(c2,0.);if (rr>0.&&w++<1.) {cm*=.5;p-=v*(d+.2);v=reflect(v,n);} else {break;}}p+=v*max(d,.002);}c*=min(t*.0625,1.);if(t>=92.&&t<96.)c*=1.-pow(min((t-92.)/4.,1.),2.);if(t>=96.)c*=min((t-96.)/5.,1.);if(t>=140.)c*=1.-min((t-140.)/8.,1.);c*=1.-.85*length(gl_FragCoord.xy-vec2(320,240))/480.;gl_FragColor=vec4(c,1);}"
]],
[[
"varying float t,er,a1,a2,a3,o1,o2,r1;varying vec3 h1,h2,h3,lv,e;void main(){t=gl_Color.x*4294967.295;h1=vec3(1);h2=vec3(1.,.6,.06);h3=vec3(.5,.75,1.);lv=vec3(200);a3=r1=0.;"+
"e=vec3(0,4,0);er=sin(t*.5)+3.02;a1=sin(t)*.1-.9;a2=sin(t*.2)*2.;a3=sin(t*.7)*.1;"+
"e=vec3(0);"+
"e.y+=(t-72.)*.2;er+=max((t-72.)*.4,0.);r1=1.;"+
"a1=sin(t*.8)*.2;"+
"a2-=.6;"+
"lv=vec3(0,160.-(t-80.)*17.,200);e.z+=t*2.;a1*=.5;a2*=.4;a2+=.6;"+
"e.y=-e.y*1.5;a1=-a1;"+
"e-=vec3(sin(a2)*er,0,cos(a2)*er);gl_Position=ftransform();}"
],
[
"varying float t,er,a1,a2,a3,r1;float cm=1.,i,b=0.,k=1.,rr=0.;varying vec3 h1,h2,h3,lv,e;vec3 h;float n1(vec3 p){p.x+=p.y*57.+p.z*21.;return cos(p.x*sin(p.x));}float n2(vec3 p){vec3 a=floor(p),b=p-a;return mix(mix(mix(n1(a),n1(a+vec3(1,0,0)),b.x),mix(n1(a+vec3(0,1,0)),n1(a+vec3(1,1,0)),b.x),b.y),mix(mix(n1(a+vec3(0,0,1)),n1(a+vec3(1,0,1)),b.x),mix(n1(a+vec3(0,1,1)),n1(a+1.),b.x),b.y),b.z)*.5+.5;}float pn(vec3 p){return n2(p*.06125)*.5+n2(p*.125)*.25+n2(p*.25)*.125;}float o(vec3 p){"+
"float s=0.,a;p=vec3(fract(p.x*.25+.5)*4.-2.,p.y+sin(p.x*.5)*sin(sin(p.z*.5)*2.+t)*.6,fract(p.z*.25+.5)*4.-2.);s=1.-max(77.-t,0.);return max(abs(length(p.xz)-2.)-.3,abs(p.y+3.+(1.-s*s)*1.6)-.3);"+
"}float oo(vec3 p){"+
"float s=0.,a;vec3 x=p;p=vec3(fract(p.x*.25+.5)*4.-2.,p.y,fract(p.z*.25+.5)*4.-2.);a=sin(sin(p.y+p.x-x.x+p.z-x.z)+t);p=vec3(p.x*cos(a)+p.z*sin(a),p.y,p.z*cos(a)-p.x*sin(a));p=vec3(p.x*cos(a)+p.y*sin(a),p.y*cos(a)-p.x*sin(a),p.z);return max(max(abs(p.x)-.8,abs(p.y)-.8),abs(p.z)-.8);"+
"}float q(vec3 p){"+
"return 1.;"+
"}float qq(vec3 p){"+
"return pn(p*1000.);"+
"}float ooo(vec3 p){float d,d2;d=o(p);d2=oo(p);if(d<d2){k=q(p);b=0.;h=h1;rr=r1;}else{d=d2;k=1.;b=qq(p)*.03;h=h2;rr=1.;}return d;}void main(){float g=0.,d,w=0.;vec3 v=normalize(vec3((gl_FragCoord.xy-vec2(320,240))/480.*1.4,1));v=vec3(v.x,v.y*cos(a1)+v.z*sin(a1),v.z*cos(a1)-v.y*sin(a1));v=vec3(v.x*cos(a3)+v.y*sin(a3),v.y*cos(a3)-v.x*sin(a3),v.z);v=vec3(v.x*cos(a2)+v.z*sin(a2),v.y,v.z*cos(a2)-v.x*sin(a2));vec3 n,r,p=e,c=(h3+.2)*pow(1.-abs(v.y),2.)+(1.-pow(min(pn(v*220.-vec3(0,t*1.3,0))+.6,1.),8.))*pow(max(v.y,0.),2.)*.5+vec3(1,.7,.4)*pow(max(dot(v,normalize(lv))*1.01,0.),105.),c2;if(t>=128.)c=c*.2+max(pow(min(pn(v*200.+t*5.)*1.5,1.),15.)-pn(v*1200.),0.)*min((t-128.)/5.,1.);while(g<1.){g=length(p-e)/20.;d=ooo(p);if(d<=0.001){vec3 l=normalize(lv-p+e);n=normalize(vec3(ooo(p+vec3(.01,0,0))-d,ooo(p+vec3(0,.01,0))-d,ooo(p+vec3(0,0,.01))-d))+b;r=reflect(l,n);if(cm==1.)c*=g;c2=((1.-g)*k*h*(max(dot(n,l),0.)+pow(max(dot(r,v),0.),17.)))*cm;for(i=1.;i<5.;i++)c2-=vec3((i*.2-ooo(p+n*i*.2))/pow(2.,i));c+=max(c2,0.);if (rr>0.&&w++<1.) {cm*=.5;p-=v*(d+.2);v=reflect(v,n);} else {break;}}p+=v*max(d,.002);}c*=min(t*.0625,1.);if(t>=92.&&t<96.)c*=1.-pow(min((t-92.)/4.,1.),2.);if(t>=96.)c*=min((t-96.)/5.,1.);if(t>=140.)c*=1.-min((t-140.)/8.,1.);c*=1.-.85*length(gl_FragCoord.xy-vec2(320,240))/480.;gl_FragColor=vec4(c,1);}"
]],
[[
"varying float t,er,a1,a2,a3,o1,o2,r1;varying vec3 h1,h2,h3,lv,e;void main(){t=gl_Color.x*4294967.295;h1=vec3(1);h2=vec3(1.,.6,.06);h3=vec3(.5,.75,1.);lv=vec3(200);a3=r1=0.;"+
"h1=mix(h1,vec3(0),max(min((t-123.)/3.,1.),0.));h2=vec3(.8,.4,.01);lv=vec3(0,(t-96.)*10.-50.,200);e=vec3(0);er=3.-cos(t*.5);a1=sin(t)*.1;a2=sin(t*.2)*-.2;a3=sin(t*.7)*.1;"+
"e-=vec3(sin(a2)*er,0,cos(a2)*er);gl_Position=ftransform();}"
],
[
"varying float t,er,a1,a2,a3,r1;float cm=1.,i,b=0.,k=1.,rr=0.;varying vec3 h1,h2,h3,lv,e;vec3 h;float n1(vec3 p){p.x+=p.y*57.+p.z*21.;return cos(p.x*sin(p.x));}float n2(vec3 p){vec3 a=floor(p),b=p-a;return mix(mix(mix(n1(a),n1(a+vec3(1,0,0)),b.x),mix(n1(a+vec3(0,1,0)),n1(a+vec3(1,1,0)),b.x),b.y),mix(mix(n1(a+vec3(0,0,1)),n1(a+vec3(1,0,1)),b.x),mix(n1(a+vec3(0,1,1)),n1(a+1.),b.x),b.y),b.z)*.5+.5;}float pn(vec3 p){return n2(p*.06125)*.5+n2(p*.125)*.25+n2(p*.25)*.125;}float o(vec3 p){"+
"p=vec3(p.x,p.y+sin(p.x)*sin(sin(p.z)*2.+t)*.2+pow(max(min((t-102.)/15.,1.),0.),2.)*30.,p.z);return min(p.y+1.,max(p.y+.8,max(abs(p.x)-.8,abs(p.z)-.8)));"+
"}float oo(vec3 p){"+
"float a=sin(sin(t))*2.;p=vec3(p.x*cos(a)+p.z*sin(a),p.y,p.z*cos(a)-p.x*sin(a));a*=.7;p=vec3(p.x*cos(a)+p.y*sin(a),p.y*cos(a*.7)-p.x*sin(a),p.z);return mix(mix(min(length(p+vec3(0,sin(t*4.)*.5,0))-.2,length(vec2(length(vec2(p.x,p.z))-.5,p.y))-.2),length(vec3(p.x*(sin(p.z*16.+t*3.)*.1+.9),p.y*(sin(p.x*16.+t*3.)*.1+.9),p.z*(sin(p.y*16.+t*3.)*.1+.9)))-.3,max(min((t-112.)/5.,1.),0.)),max(max(abs(p.x)-.1,abs(p.y)-.25),abs(p.z)-.1),pow(max(min((t-121.)/5.,1.),0.),2.));"+
"}float q(vec3 p){"+
"return 1.;"+
"}float qq(vec3 p){"+
"return pn(p*1000.);"+
"}float ooo(vec3 p){float d,d2;d=o(p);d2=oo(p);if(d<d2){k=q(p);b=0.;h=h1;rr=r1;}else{d=d2;k=1.;b=qq(p)*.03;h=h2;rr=1.;}return d;}void main(){float g=0.,d,w=0.;vec3 v=normalize(vec3((gl_FragCoord.xy-vec2(320,240))/480.*1.4,1));v=vec3(v.x,v.y*cos(a1)+v.z*sin(a1),v.z*cos(a1)-v.y*sin(a1));v=vec3(v.x*cos(a3)+v.y*sin(a3),v.y*cos(a3)-v.x*sin(a3),v.z);v=vec3(v.x*cos(a2)+v.z*sin(a2),v.y,v.z*cos(a2)-v.x*sin(a2));vec3 n,r,p=e,c=(h3+.2)*pow(1.-abs(v.y),2.)+(1.-pow(min(pn(v*220.-vec3(0,t*1.3,0))+.6,1.),8.))*pow(max(v.y,0.),2.)*.5+vec3(1,.7,.4)*pow(max(dot(v,normalize(lv))*1.01,0.),105.),c2;if(t>=128.)c=c*.2+max(pow(min(pn(v*200.+t*5.)*1.5,1.),15.)-pn(v*1200.),0.)*min((t-128.)/5.,1.);while(g<1.){g=length(p-e)/20.;d=ooo(p);if(d<=0.001){vec3 l=normalize(lv-p+e);n=normalize(vec3(ooo(p+vec3(.01,0,0))-d,ooo(p+vec3(0,.01,0))-d,ooo(p+vec3(0,0,.01))-d))+b;r=reflect(l,n);if(cm==1.)c*=g;c2=((1.-g)*k*h*(max(dot(n,l),0.)+pow(max(dot(r,v),0.),17.)))*cm;for(i=1.;i<5.;i++)c2-=vec3((i*.2-ooo(p+n*i*.2))/pow(2.,i));c+=max(c2,0.);if (rr>0.&&w++<1.) {cm*=.5;p-=v*(d+.2);v=reflect(v,n);} else {break;}}p+=v*max(d,.002);}c*=min(t*.0625,1.);if(t>=92.&&t<96.)c*=1.-pow(min((t-92.)/4.,1.),2.);if(t>=96.)c*=min((t-96.)/5.,1.);if(t>=140.)c*=1.-min((t-140.)/8.,1.);c*=1.-.85*length(gl_FragCoord.xy-vec2(320,240))/480.;gl_FragColor=vec4(c,1);}"
]],
[[
"varying float t,er,a1,a2,a3,o1,o2,r1;varying vec3 h1,h2,h3,lv,e;void main(){t=gl_Color.x*4294967.295;h1=vec3(1);h2=vec3(1.,.6,.06);h3=vec3(.5,.75,1.);lv=vec3(200);a3=r1=0.;"+
"h1=mix(h1,vec3(0),max(min((t-123.)/3.,1.),0.));h2=vec3(.8,.4,.01);lv=vec3(0,(t-96.)*10.-50.,200);e=vec3(0);er=3.-cos(t*.5);a1=sin(t)*.1;a2=sin(t*.2)*-.2;a3=sin(t*.7)*.1;"+
"er-=min(max((t-112.)/3.,0.),1.)*1.3;a2+=max(t-112.,0.)*.2;"+
"e-=vec3(sin(a2)*er,0,cos(a2)*er);gl_Position=ftransform();}"
],
[
"varying float t,er,a1,a2,a3,r1;float cm=1.,i,b=0.,k=1.,rr=0.;varying vec3 h1,h2,h3,lv,e;vec3 h;float n1(vec3 p){p.x+=p.y*57.+p.z*21.;return cos(p.x*sin(p.x));}float n2(vec3 p){vec3 a=floor(p),b=p-a;return mix(mix(mix(n1(a),n1(a+vec3(1,0,0)),b.x),mix(n1(a+vec3(0,1,0)),n1(a+vec3(1,1,0)),b.x),b.y),mix(mix(n1(a+vec3(0,0,1)),n1(a+vec3(1,0,1)),b.x),mix(n1(a+vec3(0,1,1)),n1(a+1.),b.x),b.y),b.z)*.5+.5;}float pn(vec3 p){return n2(p*.06125)*.5+n2(p*.125)*.25+n2(p*.25)*.125;}float o(vec3 p){"+
"float a=length(vec2(p.x,p.y));return mix(max(max(3.-a,a-3.2),(116.-t)*3.-p.z),3.-length(vec3(p.x*(sin(p.z*6.+t*2.)*.01+.99),p.y*(sin(p.x*6.+t*2.)*.01+.99),p.z*(sin(p.y*6.+t*2.)*.01+.99))),max(min((t-120.)/3.,1.),0.));"+
"}float oo(vec3 p){"+
"float a=sin(sin(t))*2.;p=vec3(p.x*cos(a)+p.z*sin(a),p.y,p.z*cos(a)-p.x*sin(a));a*=.7;p=vec3(p.x*cos(a)+p.y*sin(a),p.y*cos(a*.7)-p.x*sin(a),p.z);return mix(mix(min(length(p+vec3(0,sin(t*4.)*.5,0))-.2,length(vec2(length(vec2(p.x,p.z))-.5,p.y))-.2),length(vec3(p.x*(sin(p.z*16.+t*3.)*.1+.9),p.y*(sin(p.x*16.+t*3.)*.1+.9),p.z*(sin(p.y*16.+t*3.)*.1+.9)))-.3,max(min((t-112.)/5.,1.),0.)),max(max(abs(p.x)-.1,abs(p.y)-.25),abs(p.z)-.1),pow(max(min((t-121.)/5.,1.),0.),2.));"+
"}float q(vec3 p){"+
"return 1.;"+
"}float qq(vec3 p){"+
"return pn(p*1000.);"+
"}float ooo(vec3 p){float d,d2;d=o(p);d2=oo(p);if(d<d2){k=q(p);b=0.;h=h1;rr=r1;}else{d=d2;k=1.;b=qq(p)*.03;h=h2;rr=1.;}return d;}void main(){float g=0.,d,w=0.;vec3 v=normalize(vec3((gl_FragCoord.xy-vec2(320,240))/480.*1.4,1));v=vec3(v.x,v.y*cos(a1)+v.z*sin(a1),v.z*cos(a1)-v.y*sin(a1));v=vec3(v.x*cos(a3)+v.y*sin(a3),v.y*cos(a3)-v.x*sin(a3),v.z);v=vec3(v.x*cos(a2)+v.z*sin(a2),v.y,v.z*cos(a2)-v.x*sin(a2));vec3 n,r,p=e,c=(h3+.2)*pow(1.-abs(v.y),2.)+(1.-pow(min(pn(v*220.-vec3(0,t*1.3,0))+.6,1.),8.))*pow(max(v.y,0.),2.)*.5+vec3(1,.7,.4)*pow(max(dot(v,normalize(lv))*1.01,0.),105.),c2;if(t>=128.)c=c*.2+max(pow(min(pn(v*200.+t*5.)*1.5,1.),15.)-pn(v*1200.),0.)*min((t-128.)/5.,1.);while(g<1.){g=length(p-e)/20.;d=ooo(p);if(d<=0.001){vec3 l=normalize(lv-p+e);n=normalize(vec3(ooo(p+vec3(.01,0,0))-d,ooo(p+vec3(0,.01,0))-d,ooo(p+vec3(0,0,.01))-d))+b;r=reflect(l,n);if(cm==1.)c*=g;c2=((1.-g)*k*h*(max(dot(n,l),0.)+pow(max(dot(r,v),0.),17.)))*cm;for(i=1.;i<5.;i++)c2-=vec3((i*.2-ooo(p+n*i*.2))/pow(2.,i));c+=max(c2,0.);if (rr>0.&&w++<1.) {cm*=.5;p-=v*(d+.2);v=reflect(v,n);} else {break;}}p+=v*max(d,.002);}c*=min(t*.0625,1.);if(t>=92.&&t<96.)c*=1.-pow(min((t-92.)/4.,1.),2.);if(t>=96.)c*=min((t-96.)/5.,1.);if(t>=140.)c*=1.-min((t-140.)/8.,1.);c*=1.-.85*length(gl_FragCoord.xy-vec2(320,240))/480.;gl_FragColor=vec4(c,1);}"
]],
[[
"varying float t,er,a1,a2,a3,o1,o2,r1;varying vec3 h1,h2,h3,lv,e;void main(){t=gl_Color.x*4294967.295;h1=vec3(1);h2=vec3(1.,.6,.06);h3=vec3(.5,.75,1.);lv=vec3(200);a3=r1=0.;"+
"h2=h1;h1=mix(vec3(.8,.4,.01),vec3(.5,.7,.9),pow(min((t-128.)/5.,1.),2.));lv=vec3(0,0,-100);e=vec3(t-128.+cos(t*.02),0,0);er=sin(t)+3.;a1=sin(t*.8)*.14;a2=sin(t*.3)*.12;a3=sin(t*1.1)*.2;"+
"e-=vec3(sin(a2)*er,0,cos(a2)*er);gl_Position=ftransform();}"
],
[
"varying float t,er,a1,a2,a3,r1;float cm=1.,i,b=0.,k=1.,rr=0.;varying vec3 h1,h2,h3,lv,e;vec3 h;float n1(vec3 p){p.x+=p.y*57.+p.z*21.;return cos(p.x*sin(p.x));}float n2(vec3 p){vec3 a=floor(p),b=p-a;return mix(mix(mix(n1(a),n1(a+vec3(1,0,0)),b.x),mix(n1(a+vec3(0,1,0)),n1(a+vec3(1,1,0)),b.x),b.y),mix(mix(n1(a+vec3(0,0,1)),n1(a+vec3(1,0,1)),b.x),mix(n1(a+vec3(0,1,1)),n1(a+1.),b.x),b.y),b.z)*.5+.5;}float pn(vec3 p){return n2(p*.06125)*.5+n2(p*.125)*.25+n2(p*.25)*.125;}float o(vec3 p){"+
"float a=t+1.4*sin(p.x*.8);p=vec3(p.x,p.y*cos(a)+p.z*sin(a),p.z*cos(a)-p.y*sin(a));return max(max(p.x-(t-128.)-.2,max(abs(p.y)-.5,abs(p.z)-.2)),-p.x);"+
"}float oo(vec3 p){"+
"float s=0.,a;return min(p.y+1.+pow(1.-min((t-128.)/8.,1.),2.)*10.,1.);"+
"}float q(vec3 p){"+
"return 1.;"+
"}float qq(vec3 p){"+
"return 1.;"+
"}float ooo(vec3 p){float d,d2;d=o(p);d2=oo(p);if(d<d2){k=q(p);b=0.;h=h1;rr=r1;}else{d=d2;k=1.;b=qq(p)*.03;h=h2;rr=1.;}return d;}void main(){float g=0.,d,w=0.;vec3 v=normalize(vec3((gl_FragCoord.xy-vec2(320,240))/480.*1.4,1));v=vec3(v.x,v.y*cos(a1)+v.z*sin(a1),v.z*cos(a1)-v.y*sin(a1));v=vec3(v.x*cos(a3)+v.y*sin(a3),v.y*cos(a3)-v.x*sin(a3),v.z);v=vec3(v.x*cos(a2)+v.z*sin(a2),v.y,v.z*cos(a2)-v.x*sin(a2));vec3 n,r,p=e,c=(h3+.2)*pow(1.-abs(v.y),2.)+(1.-pow(min(pn(v*220.-vec3(0,t*1.3,0))+.6,1.),8.))*pow(max(v.y,0.),2.)*.5+vec3(1,.7,.4)*pow(max(dot(v,normalize(lv))*1.01,0.),105.),c2;if(t>=128.)c=c*.2+max(pow(min(pn(v*200.+t*5.)*1.5,1.),15.)-pn(v*1200.),0.)*min((t-128.)/5.,1.);while(g<1.){g=length(p-e)/20.;d=ooo(p);if(d<=0.001){vec3 l=normalize(lv-p+e);n=normalize(vec3(ooo(p+vec3(.01,0,0))-d,ooo(p+vec3(0,.01,0))-d,ooo(p+vec3(0,0,.01))-d))+b;r=reflect(l,n);if(cm==1.)c*=g;c2=((1.-g)*k*h*(max(dot(n,l),0.)+pow(max(dot(r,v),0.),17.)))*cm;for(i=1.;i<5.;i++)c2-=vec3((i*.2-ooo(p+n*i*.2))/pow(2.,i));c+=max(c2,0.);if (rr>0.&&w++<1.) {cm*=.5;p-=v*(d+.2);v=reflect(v,n);} else {break;}}p+=v*max(d,.002);}c*=min(t*.0625,1.);if(t>=92.&&t<96.)c*=1.-pow(min((t-92.)/4.,1.),2.);if(t>=96.)c*=min((t-96.)/5.,1.);if(t>=140.)c*=1.-min((t-140.)/8.,1.);c*=1.-.85*length(gl_FragCoord.xy-vec2(320,240))/480.;gl_FragColor=vec4(c,1);}"
]]
]

main()

# **************************************************************************
# *                             [ Muon Baryon ]                            *
# **************************************************************************
# *                      Synth, Visuals, Design: Ferris / Youth Uprising   *
# *  Code, Add. Design, Framework, Optimization: Decipher / Youth Uprising *
# *                                       Music: Gargaj / Umlaut Design    *
# *                     Add. Design, Bug Fixing: Duckers / Outracks        *
# *                                 Add. Design: Ehale / Youth Uprising    *
# *                                 Add. Design: Sephiron / Youth Uprising *
# *                             Special Mention: Mentor / TBC              *
# **************************************************************************
# * Thanks to Psycho / Loonies for his (however brief) explanation of the  *
# * sphere tracing algorithm, which has been hugely beaten, battered, and  *
# * pwned throughout the development of this intro.                        *
# **************************************************************************
# *         [c] 2009 Youth Uprising vs. Umlaut Design vs. Outracks         *
# **************************************************************************

