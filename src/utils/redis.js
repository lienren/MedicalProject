/*
 * @Author: Lienren 
 * @Date: 2018-04-19 14:05:57 
 * @Last Modified by: Lienren
 * @Last Modified time: 2018-06-20 12:36:22
 */
'use strict';

const config = require('../config.json');
const Redis = require('ioredis');
const redis = new Redis(config.redis);

module.exports = {
  // 获取数据
  get: key => {
    return redis.get(key);
  },
  // 设置数据
  set: (key, val) => {
    redis.set(key, val);

    return true;
  }
};
