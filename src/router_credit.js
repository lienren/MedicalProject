/*
 * @Author: Lienren 
 * @Date: 2018-06-07 14:35:15 
 * @Last Modified by: Lienren
 * @Last Modified time: 2018-10-28 18:53:17
 */
'use strict';

const Router = require('koa-router');
const ctrl = require('./controllers/credit/index.js');

const router = new Router();

router
  .post('/credit/intermediary/get', ctrl.CtrlBSIntermediary.getIntermediary)
  .post('/credit/intermediary/search', ctrl.CtrlBSIntermediary.searchIntermediary)
  .post('/credit/intermediary/add', ctrl.CtrlBSIntermediary.addIntermediary)
  .post('/credit/intermediary/edit', ctrl.CtrlBSIntermediary.editIntermediary)
  .post('/credit/intermediary/del', ctrl.CtrlBSIntermediary.delIntermediary)
  .post('/credit/intermediary/verfiy', ctrl.CtrlBSIntermediary.verfiyIntermediary)
  .post('/credit/loanuser/get', ctrl.CtrlBSIntermediary.getLoanUser)
  .post('/credit/loanuser/search', ctrl.CtrlBSIntermediary.searchLoanUser)
  .post('/credit/loanuser/add', ctrl.CtrlBSIntermediary.addLoanUser)
  .post('/credit/loanuser/edit', ctrl.CtrlBSIntermediary.editLoanUser)
  .post('/credit/loanuser/del', ctrl.CtrlBSIntermediary.delLoanUser)
  .post('/credit/loanuser/verfiy', ctrl.CtrlBSIntermediary.verfiyLoanUser)
  .post('/credit/loanorder/getloanorder', ctrl.CtrlBSIntermediary.getLoanOrder)
  .post('/credit/loanorder/getloanorderdetail', ctrl.CtrlBSIntermediary.getLoanOrderDetail)
  .post('/credit/loanorder/addloanorder', ctrl.CtrlBSIntermediary.addLoanOrder)
  .post('/credit/loanorder/addloanorderstate', ctrl.CtrlBSIntermediary.addLoanOrderState)
  .post('/credit/loanorder/getloanorderstate', ctrl.CtrlBSIntermediary.getLoanOrderState)
  .post('/credit/loanorder/getstsorders', ctrl.CtrlBSIntermediary.getStsOrders)
  .post('/credit/loanorder/getstsordersall', ctrl.CtrlBSIntermediary.getStsOrdersAll)
  .post('/credit/loanorder/getstsordersort', ctrl.CtrlBSIntermediary.getStsOrderSort);

module.exports = router.routes();
