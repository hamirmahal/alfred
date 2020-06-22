(window.webpackJsonp=window.webpackJsonp||[]).push([[32],{84:function(e,t,n){"use strict";n.r(t),n.d(t,"frontMatter",(function(){return c})),n.d(t,"metadata",(function(){return o})),n.d(t,"rightToc",(function(){return l})),n.d(t,"default",(function(){return p}));var r=n(2),a=n(7),i=(n(0),n(91)),c={id:"getting-started",title:"Getting Started"},o={id:"getting-started",isDocsHomePage:!1,title:"Getting Started",description:"`bash",source:"@site/docs/getting-started.md",permalink:"/docs/getting-started",editUrl:"https://github.com/amilajack/alfred/edit/master/website/docs/getting-started.md",sidebar:"docs",previous:{title:"What is Alfred?",permalink:"/docs/what-is-alfred"},next:{title:"Command Line Interface",permalink:"/docs/cli"}},l=[{value:"Learning Skills",id:"learning-skills",children:[]},{value:"Community",id:"community",children:[]}],u={rightToc:l};function p(e){var t=e.components,n=Object(a.a)(e,["components"]);return Object(i.b)("wrapper",Object(r.a)({},u,n,{components:t,mdxType:"MDXLayout"}),Object(i.b)("pre",null,Object(i.b)("code",Object(r.a)({parentName:"pre"},{className:"language-bash"}),"# Create a new project\nnpx alfred new my-project\ncd my-project\n\n# Build your project\nnpx alfred run build\n")),Object(i.b)("p",null,"For migrating to Alfred, see ",Object(i.b)("a",Object(r.a)({parentName:"p"},{href:"migrating-to-alfred"}),"the migrating guide")),Object(i.b)("h2",{id:"learning-skills"},"Learning Skills"),Object(i.b)("pre",null,Object(i.b)("code",Object(r.a)({parentName:"pre"},{className:"language-bash"}),"# Learning skills\nalfred learn @alfred/skill-react @alfred/skill-redux\n")),Object(i.b)("h2",{id:"community"},"Community"),Object(i.b)("p",null,"All feedback and suggestions are welcome!"),Object(i.b)("ul",null,Object(i.b)("li",{parentName:"ul"},"\ud83d\udcac Join the community on ",Object(i.b)("a",Object(r.a)({parentName:"li"},{href:"https://spectrum.chat/alfred"}),"Spectrum")),Object(i.b)("li",{parentName:"ul"},"\ud83d\udce3 Stay up to date on new features and announcements on ",Object(i.b)("a",Object(r.a)({parentName:"li"},{href:"https://twitter.com/alfredpkg"}),"@alfredpkg"),".")))}p.isMDXComponent=!0},91:function(e,t,n){"use strict";n.d(t,"a",(function(){return s})),n.d(t,"b",(function(){return m}));var r=n(0),a=n.n(r);function i(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function c(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);t&&(r=r.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,r)}return n}function o(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?c(Object(n),!0).forEach((function(t){i(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):c(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function l(e,t){if(null==e)return{};var n,r,a=function(e,t){if(null==e)return{};var n,r,a={},i=Object.keys(e);for(r=0;r<i.length;r++)n=i[r],t.indexOf(n)>=0||(a[n]=e[n]);return a}(e,t);if(Object.getOwnPropertySymbols){var i=Object.getOwnPropertySymbols(e);for(r=0;r<i.length;r++)n=i[r],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(a[n]=e[n])}return a}var u=a.a.createContext({}),p=function(e){var t=a.a.useContext(u),n=t;return e&&(n="function"==typeof e?e(t):o(o({},t),e)),n},s=function(e){var t=p(e.components);return a.a.createElement(u.Provider,{value:t},e.children)},d={inlineCode:"code",wrapper:function(e){var t=e.children;return a.a.createElement(a.a.Fragment,{},t)}},b=a.a.forwardRef((function(e,t){var n=e.components,r=e.mdxType,i=e.originalType,c=e.parentName,u=l(e,["components","mdxType","originalType","parentName"]),s=p(n),b=r,m=s["".concat(c,".").concat(b)]||s[b]||d[b]||i;return n?a.a.createElement(m,o(o({ref:t},u),{},{components:n})):a.a.createElement(m,o({ref:t},u))}));function m(e,t){var n=arguments,r=t&&t.mdxType;if("string"==typeof e||r){var i=n.length,c=new Array(i);c[0]=b;var o={};for(var l in t)hasOwnProperty.call(t,l)&&(o[l]=t[l]);o.originalType=e,o.mdxType="string"==typeof e?e:r,c[1]=o;for(var u=2;u<i;u++)c[u]=n[u];return a.a.createElement.apply(null,c)}return a.a.createElement.apply(null,n)}b.displayName="MDXCreateElement"}}]);