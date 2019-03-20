/*
 * @Author: Lienren
 * @Date: 2019-03-20 21:47:55
 * @Last Modified by: Lienren
 * @Last Modified time: 2019-03-20 21:50:10
 */
'use strict';

const path = require('path');
const assert = require('assert');
const date = require('../../utils/date');
const comm = require('../../utils/comm');
const encrypt = require('../../utils/encrypt');
const validate = require('../../utils/validate');
const io = require('../../utils/io');

const configData = require('../ConfigData');

module.exports = {
  login: async ctx => {
    let demo = { test: '123' };
    ctx.body = {
      demo
    };
  }
};
