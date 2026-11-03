import {createApp,background} from './app.js';
export default {
 async fetch(request,env){const path=new URL(request.url).pathname;if(path.startsWith('/api/'))return createApp({db:env.DB,env})(request);return env.ASSETS.fetch(request);},
 async scheduled(event,env,ctx){ctx.waitUntil(background(env.DB,env));}
};
