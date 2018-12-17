/**
 * @author yangyufei
 * @date 2018-12-15 10:22:16
 * @desc
 */
const cheerio           = require('cheerio');
const moment            = require('moment');

const {requestUrl}      = require('../core/utils');
const SysConf           = require('../config');
const {timeout, retry}  = SysConf.SPIDER.fetch;

exports.NAVI_PAGE_SIZE  = 25;

/**
 * 获取所有城市信息
 * @returns {Promise<Array>}
 */
exports.getAllCity = async () => {
    let reqConf = {
        uri     : `http://inn.ctrip.com/inn/Tool/AjaxGetCitySuggestion.aspx`,
        method  : 'GET',
        useProxy: true,
    };

    let cityStr = await requestUrl(reqConf, null, res => /suggestion/.test(res));
    let resStr = `var cQuery = {};${cityStr}`;
    eval(resStr);

    let cityList = [];
    for (let key in cQuery.jsonpResponse.suggestion) {
        let list = cQuery.jsonpResponse.suggestion[key];
        if (!/热门/.test(key)) {
            list = list.map(cityObj => {
                let tmp = cityObj.data.split('|');
                let city = {
                    pinyin  : tmp[0],
                    name    : tmp[1],
                    id      : tmp[2]
                };
                return city;
            });

            cityList = [...cityList, ...list];
        }
    }

    return cityList;
};

/**
 * 获取导航页信息
 * @param cityId
 * @param cityName
 * @param page
 * @returns {Promise<{count: *, sumPage: number, records: Array}>}
 */
exports.getNaviData = async (cityId, cityName, page) => {
    let reqConf = {
        uri     : `http://inn.ctrip.com/inn/Tool/AjaxHotelBaseList.aspx`,
        method  : 'POST',
        useProxy: true,
        json    : true,
        form    : {cityId, page},
    };

    let res = await requestUrl(reqConf, 5, res => res.hasOwnProperty('hotelAmount'));

    let data = {count: res.hotelAmount, sumPage: Math.ceil(res.hotelAmount / exports.NAVI_PAGE_SIZE), records: []};

    let $ = cheerio.load(res.hotelList);
    $('.searchresult_list').each(function () {
        data.records.push({
            id      : $(this).attr('id'),
            city    : cityName
        });
    });

    return data;
};

/**
 * 读取客栈信息
 * @param hotelId
 */
exports.getHotelData = async hotelId => {
    let reqConf = {
        uri     : `http://inn.ctrip.com/inn/${hotelId}.html`,
        method  : 'GET',
        useProxy: true,
        transform: res => cheerio.load(res)
    };

    let $ = await requestUrl(reqConf, 5, $ => $('.hi_name > .cn_t').length > 0);

    let hotel = {
        region  : '', // 区县
        name    : $('.hi_name > .cn_t').text(), // 中文名称
        enName  : $('.hi_name > .en_t').text(), // 英文名称
        address : $('span.hi_address > span').text(), // 地址详情
        businessCenter : '', // 商圈列表
        price   : $('.hi_booking > .price_box > .hi_price > .hi_price > span').text(), // 最低价
        score   : $('.mark_box > .mark').text(), // 评分
        services: '', // 提供服务
        openTime: '', // 开业时间
        decorateTime: '', // 装修时间
        roomCount: '', // 房间数量
        phone   : '', // 联系方式
        desc    : $('.J_needShowAllText').length > 0 ? $('.J_needShowAllText').text().replace(/\s|\|/g, '') : '', // 描述
        wifi    : '', // 网络设施
        stopCar : '', // 停车场设施
        facilities: '', // 酒店设备
        checkIn : '', // 入店时间
        checkOut: '', // 离店时间
        children: '', // 儿童政策
        food    : '', // 膳食安排
        pet     : '', // 宠物政策
        tags    : '', // 用户印象标签
    };

    $('.path_bar > a').length >= 3 && (hotel.region = $('.path_bar > a:nth-child(3)').text());

    let bcList = [];
    $('span.hi_address > a').length > 0 && $('span.hi_address > a').each(function () {
        bcList.push($(this).text());
    });
    hotel.businessCenter = bcList.join();

    let serviceList = [];
    $('#base_bd > .service_list > li').length > 0 && $('#base_bd > .service_list > li').each(function () {
        serviceList.push($(this).text());
    });
    hotel.services = serviceList.join();

    if ($('.htl_s_info').length > 0) {
        let tmp = $('.htl_s_info').text().split(/\s/);
        tmp.forEach(item => {
            /开业/.test(item) && (hotel.openTime = item.replace('年开业', ''));
            /装修/.test(item) && (hotel.decorateTime = item.replace('年装修', ''));
            /间房/.test(item) && (hotel.roomCount = item.replace('间房', ''));
        })
    }

    if ($('#J_realContact').length > 0) {
        let phoneList = [];
        let tmp = $('#J_realContact').attr('data-real').split(/\s/);
        tmp.forEach(item => {
            /电话|传真/.test(item) && phoneList.push(item.replace(/电话|传真/g, ''));
        });
        hotel.phone = phoneList.join();
    }

    $('.htl_facilities_tb > tbody > tr').each(function () {
        let title = $(this).find('th').text();

        let value = '';
        $(this).find('td li').each(function () {
            value += $(this).text() + ','
        });

        /网络/.test(title) && (hotel.wifi = value);
        /停车场/.test(title) && (hotel.stopCar = value);
        /客栈/.test(title) && (hotel.facilities = value);
    });

    $('.htl_policy_tb tbody > tr').each(function () {
        let title = $(this).find('th').text();

        let value = '';
        $(this).find('td').each(function () {
            value += $(this).text() + ','
        });

        if (/入住/.test(title)) {
            let tmp = value.split(/\s/);
            tmp.forEach(item => {
                /入住/.test(item) && (hotel.checkIn = item);
                /离店/.test(item) && (hotel.checkOut = item);
            })
        }

        /儿童/.test(title) && (hotel.children = value);
        /膳食/.test(title) && (hotel.food = value);
        /宠物/.test(title) && (hotel.pet = value);
    });

    let tagList = [];
    $('.htl_impress_list > a').each(function () {
        tagList.push($(this).text());
    });
    hotel.tags = tagList.join();

    hotel.price = hotel.price ? parseFloat(hotel.price) : null;
    hotel.score = hotel.score ? parseFloat(hotel.score) : null;
    hotel.roomCount = hotel.roomCount ? parseInt(hotel.roomCount) : null;

    return hotel;
};

/**
 * 获取房间信息
 * @param hotelId
 * @returns {Promise<Array>}
 */
exports.getRoomList = async hotelId => {
    let reqConf = {
        uri     : 'http://inn.ctrip.com/inn/tool/Detail/Inn_AjaxGetAllRoom.aspx',
        method  : 'GET',
        useProxy: true,
        transform: res => cheerio.load(res),
        qs      : {
            hotel: hotelId
        }
    };

    let $ = await requestUrl(reqConf, 5, $ => $('.htl_room_list').length);

    let rooms = [];

    $('.htl_room_list > li').each(function () {
        let room = {
            uri         : `http://inn.ctrip.com/inn/${hotelId}.html`,
            type        : '民宿_房间',
            xybs        : 'ctrip_minsu_room',
            siteName    : '携程',
            createAt    : moment().format('YYYY-MM-DD HH:mm:ss'),

            name        : $(this).find('.htl_room_info > h4').text(), // 标题
            area        : '', // 面积
            bed         : '', // 床位信息
            addBed      : '', // 是否可以加床
            roomType    : '', // 房间类型（标准、内宾等）
            bedType     : '', // 床型
            breakfast   : '', // 早餐
            net         : '', // 网络
            policy      : '', // 政策
            price       : '', // 价格

            hotelId,
        };

        let tmp = $(this).find('.info').text().split('|');
        tmp.forEach(item => {
            /平方/.test(item) && (room.area = item);
            /张/.test(item) && (room.bed = item);
            /加床/.test(item) && (room.addBed = item);
        });

        $(this).find('.htl_room_tb > tbody > tr:nth-child(2) > td').each(function (index) {
            let value = $(this).text().replace(/\s|¥/g, '');
            switch(index) {
                case 0: room.roomType = value; break;
                case 1: room.bedType = value; break;
                case 2: room.breakfast = value; break;
                case 3: room.net = value; break;
                case 4: room.policy = value; break;
                case 5: room.price = value; break;
            }
        });

        room.area = room.area ? parseFloat(room.area) : null;
        room.addBed = room.hasOwnProperty('addBed') ? Boolean(room.addBed) : null;
        room.price = room.price ? parseFloat(room.price) : null;

        rooms.push(room);
    });

    return rooms;
};