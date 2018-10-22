/*
 * @Author: Lienren 
 * @Date: 2018-09-07 22:38:15 
 * @Last Modified by: Lienren
 * @Last Modified time: 2018-10-22 13:53:43
 */
'use strict';

const Op = require('sequelize').Op;
const assert = require('assert');
const date = require('../../utils/date');

const configData = require('../ConfigData');

module.exports = {
  /***************************** 科室管理 *************************************/
  getDeps: async ctx => {
    let current = ctx.request.body.current || 1;
    let pageSize = ctx.request.body.pageSize || 20;

    let resultCount = await ctx.orm().BSDep.findAndCount({
      where: {
        isDel: 0
      }
    });
    let result = await ctx.orm().BSDep.findAll({
      offset: (current - 1) * pageSize,
      limit: pageSize,
      where: {
        isDel: 0
      },
      order: [['id', 'DESC']]
    });

    ctx.body = {
      total: resultCount.count,
      list: result,
      current,
      pageSize
    };
  },
  getDepList: async ctx => {
    let result = await ctx.orm().BSDep.findAll({
      where: {
        isDel: 0
      },
      order: [['id', 'DESC']]
    });

    ctx.body = result;
  },
  addDep: async ctx => {
    let depName = ctx.request.body.depName || '';
    let now = date.getTimeStamp();

    assert.notStrictEqual(depName, '', 'InputParamIsNull');

    let sameResult = await ctx.orm().BSDep.findOne({
      where: {
        depName: depName,
        isDel: 0
      }
    });

    assert.ok(sameResult === null, 'DepNameExists');

    ctx.orm().BSDep.create({
      depName: depName,
      addTime: now,
      isDel: 0
    });

    ctx.body = {};
  },
  delDep: async ctx => {
    let id = ctx.request.body.id || 0;

    assert.notStrictEqual(id, 0, 'InputParamIsNull');

    ctx.orm().BSDep.update(
      {
        isDel: 1
      },
      {
        where: {
          id: id
        }
      }
    );

    ctx.body = {};
  },
  /***************************** 诊所管理 *************************************/
  getCLs: async ctx => {
    let current = ctx.request.body.current || 1;
    let pageSize = ctx.request.body.pageSize || 20;

    let resultCount = await ctx.orm().BSCL.findAndCount({
      where: {
        isDel: 0
      }
    });
    let result = await ctx.orm().BSCL.findAll({
      offset: (current - 1) * pageSize,
      limit: pageSize,
      where: {
        isDel: 0
      },
      order: [['id', 'DESC']]
    });

    ctx.body = {
      total: resultCount.count,
      list: result,
      current,
      pageSize
    };
  },
  getCLList: async ctx => {
    let result = await ctx.orm().BSCL.findAll({
      where: {
        isDel: 0
      },
      order: [['id', 'DESC']]
    });

    ctx.body = result;
  },
  getCL: async ctx => {
    let id = ctx.request.body.id || 0;

    assert.notStrictEqual(id, 0, 'InputParamIsNull');

    let resultCL = await ctx.orm().BSCL.findOne({
      where: {
        id: id,
        isDel: 0
      }
    });
    let resultCLDep = await ctx.orm().BSCLDep.findAll({
      where: {
        clId: id
      }
    });

    ctx.body = {
      cl: resultCL,
      cldeps: resultCLDep
    };
  },
  addCL: async ctx => {
    let clName = ctx.request.body.clName || '';
    let clHeadImg = ctx.request.body.clHeadImg || '';
    let clAddress = ctx.request.body.clAddress || '';
    let clTel = ctx.request.body.clTel || '';
    let clDeps = ctx.request.body.clDeps || [];
    let now = date.getTimeStamp();

    assert.notStrictEqual(clName, '', 'InputParamIsNull');
    assert.notStrictEqual(clHeadImg, '', 'InputParamIsNull');
    assert.notStrictEqual(clAddress, '', 'InputParamIsNull');
    assert.notStrictEqual(clTel, '', 'InputParamIsNull');

    let sameResult = await ctx.orm().BSCL.findOne({
      where: {
        clName: clName,
        isDel: 0
      }
    });

    assert.ok(sameResult === null, 'CLNameExists');

    let result = await ctx.orm().BSCL.create({
      clName: clName,
      clHeadImg: clHeadImg,
      clAddress: clAddress,
      clTel: clTel,
      addTime: now,
      lastTime: now,
      isDel: 0
    });

    if (result.id && result.id > 0) {
      // 批量添加科室
      let data = clDeps.map(depid => {
        return { clId: result.id, depId: parseInt(depid), addTime: now };
      });
      ctx.orm().BSCLDep.bulkCreate(data);
    }

    ctx.body = {};
  },
  editCL: async ctx => {
    let id = ctx.request.body.id || 0;
    let clName = ctx.request.body.clName || '';
    let clHeadImg = ctx.request.body.clHeadImg || '';
    let clAddress = ctx.request.body.clAddress || '';
    let clTel = ctx.request.body.clTel || '';
    let clDeps = ctx.request.body.clDeps || [];
    let now = date.getTimeStamp();

    assert.notStrictEqual(id, 0, 'InputParamIsNull');
    assert.notStrictEqual(clName, '', 'InputParamIsNull');
    assert.notStrictEqual(clHeadImg, '', 'InputParamIsNull');
    assert.notStrictEqual(clAddress, '', 'InputParamIsNull');
    assert.notStrictEqual(clTel, '', 'InputParamIsNull');

    let sameResult = await ctx.orm().BSCL.findOne({
      where: {
        id: { [Op.ne]: id },
        clName: clName,
        isDel: 0
      }
    });

    assert.ok(sameResult === null, 'CLNameExists');

    let result = await ctx.orm().BSCL.update(
      {
        clName: clName,
        clHeadImg: clHeadImg,
        clAddress: clAddress,
        clTel: clTel,
        lastTime: now
      },
      {
        where: {
          id: id,
          isDel: 0
        }
      }
    );

    // 删除诊所所有科室
    await ctx
      .orm()
      .query(`delete from BSCLDep where clId = ${id}`)
      .spread((results, metadata) => {});

    // 批量添加科室
    let data = clDeps.map(depid => {
      return { clId: id, depId: parseInt(depid), addTime: now };
    });
    ctx.orm().BSCLDep.bulkCreate(data);

    ctx.body = {};
  },
  delCL: async ctx => {
    let id = ctx.request.body.id || 0;
    let now = date.getTimeStamp();

    assert.notStrictEqual(id, 0, 'InputParamIsNull');

    ctx.orm().BSCL.update(
      {
        lastTime: now,
        isDel: 1
      },
      {
        where: {
          id: id
        }
      }
    );

    ctx.body = {};
  },
  /***************************** 医师管理 *************************************/
  getDors: async ctx => {
    let current = ctx.request.body.current || 1;
    let pageSize = ctx.request.body.pageSize || 20;

    let resultCount = await ctx.orm().BSDoctor.findAndCount({
      where: {
        isDel: 0
      }
    });
    let result = await ctx.orm().BSDoctor.findAll({
      offset: (current - 1) * pageSize,
      limit: pageSize,
      where: {
        isDel: 0
      },
      order: [['id', 'DESC']]
    });

    ctx.body = {
      total: resultCount.count,
      list: result,
      current,
      pageSize
    };
  },
  getDorList: async ctx => {
    let result = await ctx.orm().BSDoctor.findAll({
      where: {
        isDel: 0
      },
      order: [['id', 'DESC']]
    });

    ctx.body = result;
  },
  getDor: async ctx => {
    let id = ctx.request.body.id || 0;

    assert.notStrictEqual(id, 0, 'InputParamIsNull');

    let resultDor = await ctx.orm().BSDoctor.findOne({
      where: {
        id: id,
        isDel: 0
      }
    });
    let resultDorDep = await ctx.orm().BSDoctorDep.findAll({
      where: {
        dorId: id
      }
    });

    ctx.body = {
      dor: resultDor,
      dordeps: resultDorDep
    };
  },
  addDor: async ctx => {
    let dorName = ctx.request.body.dorName || '';
    let dorHeadImg = ctx.request.body.dorHeadImg || '';
    let clId = ctx.request.body.clId || 0;
    let clName = ctx.request.body.clName || '';
    let goodAt = ctx.request.body.goodAt || '';
    let remark = ctx.request.body.remark || '';
    let detailRemark = ctx.request.body.detailRemark || '';
    let position = ctx.request.body.position || '';
    let dorDeps = ctx.request.body.dorDeps || [];
    let now = date.getTimeStamp();

    assert.notStrictEqual(dorName, '', 'InputParamIsNull');
    assert.notStrictEqual(dorHeadImg, '', 'InputParamIsNull');
    assert.notStrictEqual(clId, 0, 'InputParamIsNull');
    assert.notStrictEqual(clName, '', 'InputParamIsNull');
    assert.notStrictEqual(goodAt, '', 'InputParamIsNull');
    assert.notStrictEqual(remark, '', 'InputParamIsNull');
    assert.notStrictEqual(detailRemark, '', 'InputParamIsNull');
    assert.notStrictEqual(position, '', 'InputParamIsNull');

    let result = await ctx.orm().BSDoctor.create({
      dorName: dorName,
      dorHeadImg: dorHeadImg,
      clId: clId,
      clName: clName,
      goodAt: goodAt,
      remark: remark,
      detailRemark: detailRemark,
      position: position,
      addTime: now,
      lastTime: now,
      isDel: 0
    });

    if (result.id && result.id > 0) {
      // 批量添加科室
      let data = dorDeps.map(depid => {
        return { dorId: result.id, depId: parseInt(depid), addTime: now };
      });
      ctx.orm().BSDoctorDep.bulkCreate(data);
    }

    ctx.body = {};
  },
  editDor: async ctx => {
    let id = ctx.request.body.id || 0;
    let dorName = ctx.request.body.dorName || '';
    let dorHeadImg = ctx.request.body.dorHeadImg || '';
    let clId = ctx.request.body.clId || 0;
    let clName = ctx.request.body.clName || '';
    let goodAt = ctx.request.body.goodAt || '';
    let remark = ctx.request.body.remark || '';
    let detailRemark = ctx.request.body.detailRemark || '';
    let position = ctx.request.body.position || '';
    let dorDeps = ctx.request.body.dorDeps || [];
    let now = date.getTimeStamp();

    assert.notStrictEqual(id, 0, 'InputParamIsNull');
    assert.notStrictEqual(dorName, '', 'InputParamIsNull');
    assert.notStrictEqual(dorHeadImg, '', 'InputParamIsNull');
    assert.notStrictEqual(clId, 0, 'InputParamIsNull');
    assert.notStrictEqual(clName, '', 'InputParamIsNull');
    assert.notStrictEqual(goodAt, '', 'InputParamIsNull');
    assert.notStrictEqual(remark, '', 'InputParamIsNull');
    assert.notStrictEqual(detailRemark, '', 'InputParamIsNull');
    assert.notStrictEqual(position, '', 'InputParamIsNull');

    let result = await ctx.orm().BSDoctor.update(
      {
        dorName: dorName,
        dorHeadImg: dorHeadImg,
        clId: clId,
        clName: clName,
        goodAt: goodAt,
        remark: remark,
        detailRemark: detailRemark,
        position: position,
        lastTime: now
      },
      {
        where: {
          id: id,
          isDel: 0
        }
      }
    );

    // 删除所有科室
    await ctx
      .orm()
      .query(`delete from BSDoctorDep where dorId = ${id}`)
      .spread((results, metadata) => {});

    // 批量添加科室
    let data = dorDeps.map(depid => {
      return { dorId: id, depId: parseInt(depid), addTime: now };
    });
    ctx.orm().BSDoctorDep.bulkCreate(data);

    ctx.body = {};
  },
  delDor: async ctx => {
    let id = ctx.request.body.id || 0;
    let now = date.getTimeStamp();

    assert.notStrictEqual(id, 0, 'InputParamIsNull');

    ctx.orm().BSDoctor.update(
      {
        lastTime: now,
        isDel: 1
      },
      {
        where: {
          id: id
        }
      }
    );

    ctx.body = {};
  }
};
