/*
 * @Author: Lienren 
 * @Date: 2018-06-07 14:41:33 
 * @Last Modified by: Lienren
 * @Last Modified time: 2018-06-21 19:35:44
 */
'use strict';

const assert = require('assert');
const comm = require('../utils/comm');
const makeimgcode = require('../utils/makeimgcode');
const encrypt = require('../utils/encrypt');
const http = require('../utils/http');
const wait = require('../utils/delay');

module.exports = {
  hello: async (ctx, next) => {
    ctx.body = {
      context: 'hello world!',
      guid: comm.getGuid()
    };
  },
  waitHello: async (ctx, next) => {
    let delayTime = 3000;
    ctx.body = {
      context: 'hello world!',
      guid: comm.getGuid(),
      delayTime: delayTime
    };

    await wait(delayTime);
  },
  getUsers: async (ctx, next) => {
    let result = await ctx.orm().users.findAll();

    ctx.body = result;
  },
  getUserByRedis: async (ctx, next) => {
    let redis = require('../utils/redis');
    await redis.set('lienren', JSON.stringify({ name: 'Lienren', age: 34 }));
    let result = await redis.get('lienren');

    ctx.body = {
      context: JSON.parse(result)
    };
  },
  postParam: async (ctx, next) => {
    let param = ctx.request.body.param;
    ctx.body = {
      param: param
    };
  },
  requestHttp: async (ctx, next) => {
    let id = ctx.request.body.id || 100;
    let areaId = ctx.request.body.areaid || 1;
    let reqUrl = 'https://fn.51pinzhi.cn/sku/sku/product/pro';

    let result = await http.post({
      url: reqUrl,
      data: {
        id: id,
        areaid: areaId
      },
      headers: ctx.headers
    });

    ctx.body = result.data;
  },
  uploadFile: async (ctx, next) => {
    ctx.body = {
      file: ctx.req.files
    };
  },
  getImageCode: async (ctx, next) => {
    let code = comm.randCode(4);
    let imgCode = await makeimgcode.makeCapcha(code, 90, 30, {
      ...{ bgColor: 0xffffff, topMargin: { base: 5, min: -8, max: 8 } }
    });
    let imgCodeBase64 = 'data:image/bmp;base64,' + imgCode.getFileData().toString('base64');

    ctx.body = {
      imgbase64: imgCodeBase64
    };
  }
};
