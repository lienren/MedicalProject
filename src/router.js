/*
 * @Author: Lienren 
 * @Date: 2018-06-07 14:35:15 
 * @Last Modified by: Lienren
 * @Last Modified time: 2018-08-15 17:34:01
 */
'use strict';

const Router = require('koa-router');
const uploadFile = require('./utils/uploadfile');
const ctrl = require('./controllers/index.js');

const router = new Router();

router
  // 获取图形验证码
  .post('/base/getimagecode', ctrl.CtrlBase.getImageCode)

  // 管理员登录
  .post('/super/login', ctrl.CtrlManager.login)
  // 管理员修改密码
  .post('/super/setpassword', ctrl.CtrlManager.setPassword)
  .all('/wx/url', ctrl.CtrlWx.getUrl)
  .all('/wx/user', ctrl.CtrlWx.getUserInfo)
  // ueditor接口
  .all('/ueditor/ue', ctrl.CtrlUEditor.ue);

module.exports = router.routes();
