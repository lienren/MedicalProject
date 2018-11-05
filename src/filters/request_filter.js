/*
 * @Author: Lienren 
 * @Date: 2018-04-19 13:38:30 
 * @Last Modified by: Lienren
 * @Last Modified time: 2018-11-01 23:21:25
 */
'use strict';

const Op = require('sequelize').Op;
const assert = require('assert');
const date = require('../utils/date');
const log = require('../utils/log');

module.exports = async (ctx, next) => {
  let now = date.getTimeStamp();
  // 响应开始时间
  const requestStartTime = new Date();
  let requestEndTime = 0;

  let headers = ctx.request.headers;
  let apiUrl = ctx.request.path || '';
  let token = headers['authentication'] || '';

  ctx.request.body = {
    ...ctx.request.query,
    ...ctx.request.body
  };

  ctx.work = {
    managerId: 0, // 管理员编号
    managerLoginName: '', // 管理员帐号
    managerRealName: '', // 管理员真实姓名
    managerPhone: '', // 管理员手机号
    pageName: '',
    pageUrl: ctx.url,
    actionName: '',
    eventName: '',
    activeName: ''
  };

  try {
    // 获取注册的API接口地址
    let resultApi = await ctx.orm().BaseApi.findOne({ where: { apiUrl: apiUrl } });
    assert.notStrictEqual(resultApi, null, 'ApiNotExists');

    ctx.work.pageName = resultApi.apiName;
    ctx.work.actionName = '执行';
    ctx.work.eventName = resultApi.apiShortName;
    ctx.work.activeName = resultApi.activeName;

    // 接口需要鉴权验证
    if (resultApi.isAuth === 1) {
      assert.notStrictEqual(token, '', 'TokenNotExists');

      switch (resultApi.apiType) {
        case 1:
          // 系统类接口
          // 根据Token获取管理员数据
          let resultManager = await ctx.orm().SuperManagerInfo.findOne({
            where: {
              token: token,
              tokenOverTime: { [Op.gt]: now },
              state: 1
            }
          });
          assert.notStrictEqual(resultManager, null, 'TokenIsFail');

          // 记录管理员信息
          ctx.work.managerId = resultManager.id;
          ctx.work.managerLoginName = resultManager.loginName;
          ctx.work.managerRealName = resultManager.realName;
          ctx.work.managerPhone = resultManager.phone;
          break;
        case 2:
          // 普通类接口
          // TODO: 根据Token获取用户数据
          break;
        default:
          // 其它接口
          break;
      }
    }

    await next();

    // 响应间隔时间
    requestEndTime = new Date();
    let ms = requestEndTime - requestStartTime;
    // 记录响应日志
    // log.logResponse(ctx, ms);

    if (apiUrl.indexOf('editor') === -1) {
      ctx.body = {
        code: '000000',
        message: 'success',
        result: ctx.body
      };
    }
  } catch (error) {
    // 响应间隔时间
    requestEndTime = new Date();
    let ms = requestEndTime - requestStartTime;

    // 获取错误信息
    let resultErrorContext = await ctx.orm().BaseErrorContext.findOne({
      where: { key: error.message }
    });

    if (resultErrorContext) {
      error.code = resultErrorContext.code;
      error.message = resultErrorContext.context;
    }

    // 记录异常日志
    log.logError(ctx, error, ms);

    ctx.body = {
      code: error.code || '999999',
      message: error.message || 'unknown error'
    };
  }

  if (ctx.work.managerId && ctx.work.managerId > 0 && ctx.work.pageUrl !== '/super/getlogs') {
    ctx.orm().SuperManagerLoginfo.create({
      pageName: ctx.work.pageName,
      pageUrl: ctx.work.pageUrl,
      actionName: ctx.work.actionName,
      eventName: ctx.work.eventName,
      activeName: ctx.work.activeName,
      addTime: requestStartTime.getTime(),
      managerId: ctx.work.managerId,
      managerRealName: ctx.work.managerRealName,
      managerLoginName: ctx.work.managerLoginName,
      managerPhone: ctx.work.managerPhone,
      reqParam: JSON.stringify(ctx.request.body),
      reqTime: requestStartTime.getTime(),
      repParam: JSON.stringify(ctx.body).length > 4900 ? '' : JSON.stringify(ctx.body),
      repTime: requestEndTime.getTime()
    });
  }
};
