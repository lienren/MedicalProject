/*
 * @Author: Lienren 
 * @Date: 2018-06-07 14:35:15 
 * @Last Modified by: Lienren
 * @Last Modified time: 2018-08-19 23:24:05
 */
'use strict';

const Router = require('koa-router');
const uploadFile = require('./utils/uploadfile');
const ctrl = require('./controllers/index.js');

const router = new Router();

router
  // 获取图形验证码
  .post('/base/getimagecode', ctrl.CtrlBase.getImageCode)
  .post('/super/login', ctrl.CtrlManager.login)
  .post('/super/setpassword', ctrl.CtrlManager.setPassword)
  .post('/super/getmanagers', ctrl.CtrlManager.getManagers)
  .post('/super/addmanager', ctrl.CtrlManager.addManager)
  .post('/super/editmanager', ctrl.CtrlManager.editManager)
  .post('/super/editmanagerstate', ctrl.CtrlManager.editManagerState)
  .post('/super/delmanager', ctrl.CtrlManager.delManager)
  .all('/wx/url', ctrl.CtrlWx.getUrl)
  .all('/wx/user', ctrl.CtrlWx.getUserInfo)
  // ueditor接口
  .all('/ueditor/ue', ctrl.CtrlUEditor.ue);

module.exports = router.routes();
