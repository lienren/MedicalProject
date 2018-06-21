/*
 * @Author: Lienren 
 * @Date: 2018-04-10 12:12:48 
 * @Last Modified by: Lienren
 * @Last Modified time: 2018-06-20 12:20:48
 */
'use strict';

const fs = require('fs');
const path = require('path');
const uuidv1 = require('uuid/v1');
const base64 = require('base64-img');

let dirUtil = {
  // 递归创建目录(异步方法)
  mkdirs: (dirname, callback) => {
    fs.exists(dirname, function(exists) {
      if (exists) {
        callback();
      } else {
        // console.log(path.dirname(dirname));
        dirUtil.mkdirs(path.dirname(dirname), function() {
          fs.mkdir(dirname, callback);
        });
      }
    });
  },
  // 递归创建目录(同步方法)
  mkdirsSync: dirname => {
    if (fs.existsSync(dirname)) {
      return true;
    } else {
      if (dirUtil.mkdirsSync(path.dirname(dirname))) {
        fs.mkdirSync(dirname);
        return true;
      }
    }
  }
};

module.exports = {
  // 获取GUID
  getGuid: () => {
    return uuidv1();
  },
  // 验证是否空值
  isEmpty: obj => {
    // null and undefined are "empty"
    if (obj === null) return true;

    // Assume if it has a length property with a non-zero value
    // that that property is correct.
    if (obj.length > 0) return false;
    if (obj.length === 0) return true;

    // If it isn't an object at this point
    // it is empty, but it can't be anything *but* empty
    // Is it empty?  Depends on your application.
    if (typeof obj !== 'object') return true;

    // Otherwise, does it have any properties of its own?
    // Note that this doesn't handle
    // toString and valueOf enumeration bugs in IE < 9
    for (var key in obj) {
      if (hasOwnProperty.call(obj, key)) return false;
    }

    return true;
  },
  // 验证是否为数字
  isNumber: val => {
    var regPos = /^\d+$/; // 非负整数
    if (regPos.test(val)) {
      return true;
    } else {
      return false;
    }
  },
  // 生成随机
  rand: (min, max) => {
    return (Math.random() * (max - min + 1) + min) | 0;
  },
  // 生成随机码（字母和数字）
  randCode: len => {
    let codes = 'ABCDEFGHKMNPQRSTUVWXYZ23456789YXWVUTSRQPNMKHGFEDCBA';
    let code = '';
    for (let i = 0; i < len; i++) {
      code += codes.charAt((Math.random() * codes.length) | 0);
    }
    return code;
  },
  // 生成随机码（数字）
  randNumberCode: len => {
    let codes = '1234567890987654321';
    let code = '';
    for (let i = 0; i < len; i++) {
      code += codes.charAt((Math.random() * codes.length) | 0);
    }
    return code;
  },
  // 递归创建目录(异步方法)
  mkdirs: (dirname, callback) => {
    dirUtil.mkdirs(dirname, callback);
  },
  // 文件重命名
  reName: (oldpath, newpath) => {
    return new Promise((resolve, reject) => {
      fs.rename(oldpath, newpath, function(err) {
        if (err) {
          console.error(err);
          reject({
            state: 'error',
            error: err
          });
        } else {
          resolve({
            state: 'success'
          });
        }
      });
    });
  },
  // 递归创建目录(同步方法)
  mkdirsSync: dirname => {
    return dirUtil.mkdirsSync(dirname);
  },
  base64ToImage: (base64img, filepath, filename) => {
    return new Promise((resolve, reject) => {
      dirUtil.mkdirsSync(filepath);

      base64.img(base64img, filepath, filename, (err, filepath) => {
        if (err) {
          console.log(err);
          reject({
            state: 'error',
            error: err
          });
        } else {
          resolve({
            state: 'success',
            filepath: filepath
          });
        }
      });
    });
  },
  imageToBase64: imgpath => {
    return new Promise((resolve, reject) => {
      base64.base64(imgpath, (err, data) => {
        if (err) {
          console.log(err);
          reject({
            state: 'error',
            error: err
          });
        } else {
          resolve({
            state: 'success',
            data: data
          });
        }
      });
    });
  }
};
