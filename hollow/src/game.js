document.write("<canvas id=c width=640 height=360 style=position:fixed;inset:0;width:100%;height:100%>");
onmousemove=e=>a=e.x/99;a=b=p=0;d=20;
with(c.getContext`webgl2`){
P=createProgram();
for(i of[35633,35632])shaderSource(S=createShader(i),i&1?`#version 300 es
void main(){gl_Position=vec4(gl_VertexID&1,gl_VertexID/2,0,.5)*4.-1.;}`:__Z__),compileShader(S),attachShader(P,S);
useProgram(P,linkProgram(P));
setInterval(_=>{
F=(p+=.016)*p%9>p/20;
F&&Math.cos(b+a)>.9||(d-=.03,b+=.02);
d<.8&&(b=-a,d-=.04)<0&&(d=20,p=0);
uniform4f(getUniformLocation(P,'u'),a,p,b,F|d<.8?d:-d);
drawArrays(4,0,3)},16)}
