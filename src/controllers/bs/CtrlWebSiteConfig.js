/*
 * @Author: Lienren 
 * @Date: 2018-09-05 20:09:01 
 * @Last Modified by: Lienren
 * @Last Modified time: 2018-09-07 23:03:57
 */
'use strict';

const assert = require('assert');
const date = require('../../utils/date');

const configData = require('../ConfigData');
let now = date.getTimeStamp();

module.exports = {
  getWebSiteConfig: async ctx => {
    let id = ctx.request.body.id || 0;

    if (id === 0) {
      let result = await ctx.orm().WebSiteConfig.findAll({
        order: [['id']]
      });

      ctx.body = result;
    } else {
      let result = await ctx.orm().WebSiteConfig.findOne({
        where: {
          id
        }
      });

      ctx.body = result;
    }
  },
  saveWebSiteConfig: async ctx => {
    let id = ctx.request.body.id || 0;
    let content = ctx.request.body.content || '';

    assert.notStrictEqual(id, 0, configData.ERROR_KEY_ENUM.InputParamIsNull);
    assert.notStrictEqual(content, '', configData.ERROR_KEY_ENUM.InputParamIsNull);

    ctx.orm().WebSiteConfig.update(
      {
        webConfigContent: content,
        lastUpdateTime: now
      },
      {
        where: {
          id
        }
      }
    );

    ctx.body = {};
  }
};
