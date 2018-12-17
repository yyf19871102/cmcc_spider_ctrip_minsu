/**
 * @auth yangyufei
 * @date 2018-12-15 17:22:35
 * @desc
 */
const moment        = require('moment');
const _             = require('lodash');

const phaseManager  = require('../core/phase');
const fetcher       = require('./fetcher');
const SysConf       = require('../config');

const NAVI_PAGE_SIZE= 1000; // 导航页每页多少条数据

exports.makeMacroTasks = async () => {
    if (SysConf.SPIDER.test.enable) {
        return [
            {name: '丽江', pinyin: 'lijiang', id: 37},
            {name: '郑州', pinyin: 'zhengzhou', id: 559},
            {name: '香格里拉', pinyin: 'shangri-la', id: 660},
        ]
    } else {
        return await fetcher.getAllCity();
    }
};

exports.makePhaseList = async context => {
    let {hotelFilter} = context.filterManager;
    let {hotelOut, roomOut} = context.outputManager;

    let phaseList = [];

    let phaseMakeNaviParams = await phaseManager.getOnePhase('makeNaviParams', 1, null, null, 10);
    let phaseGetNaviList = await phaseManager.getOnePhase('getNaviList', 2, null, null, 10);
    let phaseGetHotelInfo = await phaseManager.getOnePhase('getHotelInfo', 3, null, null, 20);

    phaseMakeNaviParams.setHandler(async cityObj => {
        let {sumPage, records} = await fetcher.getNaviData(cityObj.id, cityObj.name, 1);

        let hotelList = [];
        for (let item of records) {
            let exists = await hotelFilter.exists(item.id);
            !exists && hotelList.push(item);
        }
        await phaseGetHotelInfo.insertTasks(hotelList);


        let pageList = [];
        for (let page = 2; page <= sumPage; page++) {
            pageList.push(_.merge({}, cityObj, {page}));
        }

        await phaseGetNaviList.insertTasks(pageList);
    });

    phaseGetNaviList.setHandler(async params => {
        let {records} = await fetcher.getNaviData(params.id, params.name, params.page);

        let hotelList = [];
        for (let item of records) {
            let exists = await hotelFilter.exists(item.id);
            item.cityId = params.id;
            item.cityName = params.name;
            !exists && hotelList.push(item);
        }
        await phaseGetHotelInfo.insertTasks(hotelList);
    });

    phaseGetHotelInfo.setHandler(async hotelParams => {
        let detail = await fetcher.getHotelData(hotelParams.id);

        let hotel = {
            uri         : `http://inn.ctrip.com/inn/${hotelParams.id}.html`,
            type        : '民宿_客栈',
            site        : 'ctrip_minsu_hotel',
            siteName    : '携程',
            createAt    : moment().format('YYYY-MM-DD HH:mm:ss'),
            city        : hotelParams.cityName,

            region  : '', // 区县
            name    : '', // 中文名称
            enName  : '', // 英文名称
            address : '', // 地址详情
            businessCenter : '', // 商圈列表
            price   : '', // 最低价
            score   : '', // 评分
            services: '', // 提供服务
            openTime: '', // 开业时间
            decorateTime: '', // 装修时间
            roomCount: '', // 房间数量
            phone   : '', // 联系方式
            desc    : '', // 描述
            wifi    : '', // 网络设施
            stopCar : '', // 停车场设施
            facilities: '', // 酒店设备
            checkIn : '', // 入店时间
            checkOut: '', // 离店时间
            children: '', // 儿童政策
            food    : '', // 膳食安排
            pet     : '', // 宠物政策
            tags    : '', // 用户印象标签
            hotelId : hotelParams.id,
        };

        _.merge(hotel, detail);

        let rooms = await fetcher.getRoomList(hotelParams.id);

        await hotelOut.write([hotel]);
        await roomOut.write(rooms);
    });

    return [phaseMakeNaviParams, phaseGetNaviList, phaseGetHotelInfo];
};