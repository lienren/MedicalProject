/*
 * @Author: Lienren
 * @Date: 2018-04-19 11:52:42
 * @Last Modified by: Lienren
 * @Last Modified time: 2019-03-20 21:56:34
 */
'use strict';

console.time('APIService Running');

const http = require('http');
const path = require('path');
const koa = require('koa');
const koastatic = require('koa-static');
const cors = require('koa2-cors');
const bodyParser = require('koa-bodyparser');

const config = require('./config.json');

const app = new koa();

// 静态存放地址
app.use(koastatic(path.resolve(__dirname, config.sys.staticPath)));

// 配置跨域访问
app.use(cors());

// 清除content-encoding请求头编码
app.use(async (ctx, next) => {
  delete ctx.request.headers['content-encoding'];
  await next();
});

app.use(async (ctx, next) => {
  ctx.disableBodyParser = false;
  ctx.disableBodyParserReturn = false;

  let path = ctx.path.toLowerCase();

  if (path.indexOf('/proof/setloanpay') >= 0 || path.indexOf('editor') >= 0) {
    ctx.disableBodyParserReturn = true;
  }
  await next();
});

// 使用koa-bodyparser中间件
app.use(
  bodyParser({
    enableTypes: ['json', 'form']
  })
);

// 使用koa-orm中间件，sequelize，mysql
const db = require('./configs/mysql_db');
const orm = require('koa-orm')(db);
app.use(orm.middleware);

// 全局请求处理
const requestFilter = require('./filters/request_filter');
app.use(requestFilter);

// 路由
const router = require('./router.js');
// const router_bs = require('./router_bs.js');
const router_credit = require('./router_credit.js');
const router_proof = require('./router_proof.js');
const router_play = require('./router_play.js');
app.use(router);
// app.use(router_bs);
app.use(router_credit);
app.use(router_proof);
app.use(router_play);

// 绑定访问端口
http.createServer(app.callback()).listen(config.sys.port);

console.timeEnd('APIService Running');