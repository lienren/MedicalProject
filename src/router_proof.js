/*
 * @Author: Lienren
 * @Date: 2018-11-22 19:29:07
 * @Last Modified by: Lienren
 * @Last Modified time: 2018-12-04 10:56:14
 */
'use strict';

const Router = require('koa-router');
const ctrl = require('./controllers/proof/index.js');

const router = new Router({
  prefix: '/proof'
});

for (let className in ctrl) {
  for (let funName in ctrl[className]) {
    router.all(`/${funName}`, ctrl[className][funName]);
  }
}

module.exports = router.routes();
