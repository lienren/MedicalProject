/*
 * @Author: Lienren 
 * @Date: 2018-07-26 22:42:22 
 * @Last Modified by: Lienren
 * @Last Modified time: 2018-07-27 09:08:15
 */
'use strict';

const fs = require('fs');
const WechatAPI = require('co-wechat-api');
const OAuth = require('wechat-oauth');

let wxAppId = 'wxef7aa654043e0fde';
let wxSecret = 'e00356aaae3be56a0cf5c32af0d5b07e';

var api = new WechatAPI(
  wxAppId,
  wxSecret,
  async function() {
    var txt = await fs.readFile('access_token.txt', 'utf8');
    return JSON.parse(txt);
  },
  async function(token) {
    await fs.writeFile('access_token.txt', JSON.stringify(token));
  }
);

let config = {
  token: 'lienren',
  appid: 'wxef7aa654043e0fde',
  encodingAESKey: 'encodinAESKey',
  checkSignature: false // 可选，默认为true。由于微信公众平台接口调试工具在明文模式下不发送签名，所以如要使用该测试工具，请将其设置为false
};

let WxHelper = function(appid, secret, db) {
  var client = new OAuth(
    appid,
    secret,
    async (openid, callback) => {
      let result = await db.WxToken.findOne({
        where: {
          openid: openid
        }
      });
      return callback(null, result);
    },
    async (openid, token, callback) => {
      let result = await db.WxToken.findOne({
        where: {
          openid: openid
        }
      });

      if (result === null) {
        // 记录存在，则新增
        await db.WxToken.create({
          openid: token.openid,
          access_token: token.access_token,
          expires_in: token.expires_in,
          refresh_token: token.refresh_token,
          scope: token.scope,
          create_at: token.create_at
        });
      } else {
        // 记录存在，更新
        await db.WxToken.update(
          {
            access_token: token.access_token,
            expires_in: token.expires_in,
            refresh_token: token.refresh_token,
            scope: token.scope,
            create_at: token.create_at
          },
          {
            where: {
              openid: token.openid
            }
          }
        );
      }

      return callback(null);
    }
  );

  this.getUrl = redirectUrl => {
    return client.getAuthorizeURL(redirectUrl, 'state', 'snsapi_userinfo');
  };
  this.getAccessToken = async code => {
    return new Promise((resolve, reject) => {
      client.getAccessToken(code, (err, result) => {
        if (err) {
          console.log('getAccessToken_Error:', err);
          reject({});
        }
        resolve({
          accessToken: result.data.access_token,
          openid: result.data.openid
        });
      });
    });
  };
  this.getUser = async openid => {
    return new Promise((resolve, reject) => {
      client.getUser(openid, function(err, result) {
        if (err) {
          console.log('getUser_Error:', err);
          reject({});
        }
        resolve(result);
      });
    });
  };
};

module.exports = {
  getUrl: async ctx => {
    let wx = new WxHelper(wxAppId, wxSecret, ctx.orm());

    ctx.body = {
      url: wx.getUrl('http://api.greenmech.com.cn/wx/wx/user')
    };
  },
  getUserInfo: async ctx => {
    let code = ctx.request.body.code || '';

    let wx = new WxHelper(wxAppId, wxSecret, ctx.orm());
    let accessToken = await wx.getAccessToken(code);
    let userInfo = await wx.getUser(accessToken.openid);

    ctx.redirect(`http://api.greenmech.com.cn/wx/index.html?openid=${accessToken.openid}`);
  }
};
