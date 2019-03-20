/*
 * @Author: Lienren
 * @Date: 2019-03-20 21:50:42
 * @Last Modified by: Lienren
 * @Last Modified time: 2019-03-20 21:51:05
 */
'use strict';

const Router = require('koa-router');
const ctrl = require('./controllers/chplay/index.js');

const router = new Router({
  prefix: '/chplay'
});

for (let className in ctrl) {
  for (let funName in ctrl[className]) {
    router.all(`/${funName}`, ctrl[className][funName]);
  }
}

module.exports = router.routes();
