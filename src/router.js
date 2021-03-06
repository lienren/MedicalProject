/*
 * @Author: Lienren 
 * @Date: 2018-06-07 14:35:15 
 * @Last Modified by: Lienren
 * @Last Modified time: 2018-10-28 18:53:11
 */
'use strict';

const Router = require('koa-router');
const uploadFile = require('./utils/uploadfile');
const ctrl = require('./controllers/index.js');

const router = new Router();

router
  // 获取图形验证码
  .post('/base/getimagecode', ctrl.CtrlBase.getImageCode)
  // 上传文件
  .post('/base/uploadfile', uploadFile.getMulter('files').any(), ctrl.CtrlBase.uploadFile)
  .post('/super/login', ctrl.CtrlManager.login)
  .post('/super/setpassword', ctrl.CtrlManager.setPassword)
  /***************************** 管理员管理 *************************************/
  .post('/super/getmanagers', ctrl.CtrlManager.getManagers)
  .post('/super/addmanager', ctrl.CtrlManager.addManager)
  .post('/super/editmanager', ctrl.CtrlManager.editManager)
  .post('/super/editmanagerstate', ctrl.CtrlManager.editManagerState)
  .post('/super/delmanager', ctrl.CtrlManager.delManager)
  .post('/super/getmanagerrole', ctrl.CtrlManager.getManagerRole)
  .post('/super/setmanagerrole', ctrl.CtrlManager.setManagerRole)
  .post('/super/getmanagermenu', ctrl.CtrlManager.getManagerMenu)
  /***************************** 角色管理 *************************************/
  .post('/super/getroles', ctrl.CtrlManager.getRoles)
  .post('/super/addrole', ctrl.CtrlManager.addRole)
  .post('/super/delrole', ctrl.CtrlManager.delRole)
  .post('/super/getrolemenu', ctrl.CtrlManager.getRoleMenu)
  .post('/super/setrolemenu', ctrl.CtrlManager.setRoleMenu)
  /***************************** 菜单管理 *************************************/
  .post('/super/getmenus', ctrl.CtrlManager.getMenus)
  .post('/super/getmenulist', ctrl.CtrlManager.getMenuList)
  .post('/super/addmenu', ctrl.CtrlManager.addMenu)
  .post('/super/delmenu', ctrl.CtrlManager.delMenu)
  /***************************** 日志管理 *************************************/
  .post('/super/getlogs', ctrl.CtrlManager.getLogs)
  /***************************** 其它接口 *************************************/
  .all('/wx/url', ctrl.CtrlWx.getUrl)
  .all('/wx/user', ctrl.CtrlWx.getUserInfo)
  // ueditor接口
  .all('/ueditor/ue', ctrl.CtrlUEditor.ue);

module.exports = router.routes();
