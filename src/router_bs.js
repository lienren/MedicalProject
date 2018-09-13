/*
 * @Author: Lienren 
 * @Date: 2018-06-07 14:35:15 
 * @Last Modified by: Lienren
 * @Last Modified time: 2018-09-08 11:32:55
 */
'use strict';

const Router = require('koa-router');
const ctrl = require('./controllers/bs/index.js');

const router = new Router();

router
  /***************************** 网站管理接口 *************************************/
  .post('/bs/website/getconfig', ctrl.CtrlWebSiteConfig.getWebSiteConfig)
  .post('/bs/website/saveconfig', ctrl.CtrlWebSiteConfig.saveWebSiteConfig)
  /***************************** 科室管理接口 *************************************/
  .post('/bs/dep/getdeps', ctrl.CtrlBS.getDeps)
  .post('/bs/dep/getdeplist', ctrl.CtrlBS.getDepList)
  .post('/bs/dep/adddep', ctrl.CtrlBS.addDep)
  .post('/bs/dep/deldep', ctrl.CtrlBS.delDep)
  /***************************** 诊所管理接口 *************************************/
  .post('/bs/cl/getcls', ctrl.CtrlBS.getCLs)
  .post('/bs/cl/getcl', ctrl.CtrlBS.getCL)
  .post('/bs/cl/addcl', ctrl.CtrlBS.addCL)
  .post('/bs/cl/editcl', ctrl.CtrlBS.editCL)
  .post('/bs/cl/delcl', ctrl.CtrlBS.delCL)
  /***************************** 医师管理接口 *************************************/
  .post('/bs/dor/getdors', ctrl.CtrlBS.getDors)
  .post('/bs/dor/getdorlist', ctrl.CtrlBS.getDorList)
  .post('/bs/dor/getdor', ctrl.CtrlBS.getDor)
  .post('/bs/dor/adddor', ctrl.CtrlBS.addDor)
  .post('/bs/dor/editdor', ctrl.CtrlBS.editDor)
  .post('/bs/dor/deldor', ctrl.CtrlBS.delDor);

module.exports = router.routes();
