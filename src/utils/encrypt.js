/*
 * @Author: Lienren 
 * @Date: 2018-04-19 12:06:42 
 * @Last Modified by: Lienren
 * @Last Modified time: 2018-06-20 12:26:05
 */
'use strict';

const md5 = require('md5');
const CryptoJS = require('crypto-js');
const key = CryptoJS.enc.Utf8.parse('7e^V9FLMatcyX0kA').toString();
const iv = CryptoJS.enc.Utf8.parse('kr6V%xV&tQj8kH13').toString();

module.exports = {
  // 获取Md5加密
  getMd5: str => {
    return md5(str);
  },
  // 获取CryptoJS加密密文
  getEncryptVal: val => {
    // Triple DES 加密
    let encrypted = CryptoJS.TripleDES.encrypt(val, key, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    }).toString();

    return encrypted;
  },
  // 获取CryptoJS解密密文
  getDecryptVal: val => {
    let decrypted = CryptoJS.TripleDES.decrypt(val, key, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });
    // 转换为 utf8 字符串
    decrypted = CryptoJS.enc.Utf8.stringify(decrypted) || '';
    try {
      let obj = JSON.parse(decrypted);
      return obj;
    } catch (e) {
      return '';
    }
  }
};
