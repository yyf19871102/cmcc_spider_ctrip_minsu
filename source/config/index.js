/**
 * @auth yangyufei
 * @date 2018-12-15 17:22:35
 * @desc 配置文件
 *
 * //TODO 根据项目配置相关选项
 */
const _     = require('lodash');
const fs    = require('fs');
const path  = require('path');

const dateFormat = require('../common/date_format');

const ENV   = process.env.NODE_ENV || 'development';

let config = {
	NAME        : 'ctripMinsu', // 工程名同
    SITE_NAME   : '携程民宿', // 主站中文名称

	MONITOR     : true, // 默认加入监控当中

	// 信源配置，每个信源对应一个接口/out文件
	XINYUAN     : {
		hotelOut: {
			/**
			 * out文件名前缀；
			 * 建议和信源关键字一致
			 */
			key     : 'ctripMinsuHotel',

			/**
			 * schema详细使用见 https://github.com/epoberezkin/ajv
			 */
			schema  : {
				type: 'object',
				properties  : {
                    uri     : {type: 'string', maxLength: 50}, // uri地址
                    type    : {type: 'string', maxLength: 50, _default: '民宿-房主'}, // 信源类型描述
                    site    : {type: 'string', maxLength: 50, _default: 'inn.ctrip.com'}, // 信源标识
                    siteName: {type: 'string', maxLength: 50, _default: '携程民宿'}, // 信源网站中文名
                    createAt: {type: 'string', maxLength: 50, _default: dateFormat.getDate}, // 抓取时间
                    city    : {type: 'string', maxLength: 50}, // 城市
                    region  : {type: 'string', maxLength: 50}, // 区县
                    name    : {type: 'string', maxLength: 50}, // 中文名称
                    enName  : {type: 'string', maxLength: 50}, // 英文名称
                    address : {type: 'string', maxLength: 200}, // 地址详情
                    businessCenter: {type: 'string', maxLength: 50}, // 商圈列表（商圈之间使用英文逗号分隔）
                    price   : {type: 'number'}, // 最低价
                    score   : {type: 'number'}, // 评分
                    services: {type: 'string', maxLength: 200}, // 提供服务
                    openTime: {type: 'string', maxLength: 50}, // 开业时间
                    decorateTime: {type: 'string', maxLength: 50}, // 装修时间
                    roomCount: {type: 'integer'}, // 房间数量
                    phone   : {type: 'string', maxLength: 50}, // 联系方式
                    desc    : {type: 'string', maxLength: 200}, // 描述
                    wifi    : {type: 'string', maxLength: 50}, // 网络设施
                    stopCar : {type: 'string', maxLength: 50}, // 停车场设施
                    facilities: {type: 'string', maxLength: 50}, // 酒店设备（设备之间使用英文逗号分隔）
                    checkIn : {type: 'string', maxLength: 50}, // 入店时间
                    checkOut: {type: 'string', maxLength: 50}, // 离店时间
                    children: {type: 'string', maxLength: 50}, // 儿童政策
                    food    : {type: 'string', maxLength: 50}, // 膳食安排
                    pet     : {type: 'string', maxLength: 50}, // 宠物政策
                    tags    : {type: 'string', maxLength: 50}, // 用户印象标签（标签之间使用英文逗号分隔）
                    hotelId : {type: 'string', maxLength: 50}, // 客栈ID
                },
				required    : ['hotelId', 'name']
			},

			/**
			 * 如果subDir存在，则生成一个子目录，子目录里面存放相关out文件
			 */
			subDir  : 'hotel', // 如果subDir存在，则生成一个子目录，子目录里面存放相关out文件
		},

        roomOut : {
            key     : 'ctripMinsuRoom',
            schema  : {
                type: 'object',
                properties: {
                    uri     : {type: 'string', maxLength: 50}, // uri地址
                    type    : {type: 'string', maxLength: 50, _default: '民宿-房主'}, // 信源类型描述
                    site    : {type: 'string', maxLength: 50, _default: 'inn.ctrip.com'}, // 信源标识
                    siteName: {type: 'string', maxLength: 50, _default: '携程民宿'}, // 信源网站中文名
                    createAt: {type: 'string', maxLength: 50, _default: dateFormat.getDate}, // 抓取时间
                    name    : {type: 'string', maxLength: 50}, // 标题
                    area    : {type: 'number'}, // 面积
                    bed     : {type: 'string', maxLength: 50}, // 床位信息
                    addBed  : {type: 'boolean',}, // 是否可以加床
                    roomType: {type: 'string', maxLength: 50}, // 房间类型（标准、内宾等
                    bedType : {type: 'string', maxLength: 50}, // 床型
                    breakfast: {type: 'string', maxLength: 50}, // 早餐
                    net     : {type: 'string', maxLength: 50}, // 网络
                    policy  : {type: 'string', maxLength: 50}, // 政策
                    price   : {type: 'number'}, // 价格
                    hotelId : {type: 'string', maxLength: 50}, // 房主ID
                },
                required    : ['id', 'hotelId', 'name']
            },
            subDir  : 'room',
        },
	},

	// 过滤器配置
	FILTER      : {
		hotelFilter	: {
			name    : 'minsuHotel', // 过滤器名字
			type    : 1, // 过滤器类型
		}
	},

	// TODO 配置抓取网站的基本信息
	WEBSITE     : {
		SITENAME: '', // 网站名
		HOMEPAGE: '', // 网站主页地址
	},

	// 错误相关信息
	ERROR_OBJ   : {
		SUCCESS     : {code: 0, msg: '操作成功！'},

		DEFAULT     : {code: 100, msg: '系统错误！'},
		TIMEOUT     : {code: 101, msg: '请求访问超时！'},
		RETRYOUT    : {code: 102, msg: '超过最大重试次数！'},
		PARSEJSON   : {code: 103, msg: '异常非json数据！'},
		BAD_REQUEST : {code: 104, msg: 'uri请求错误！'},
		BAD_CONFIG  : {code: 105, msg: '配置错误！'},
		CHECK_RULE  : {code: 106, msg: '网站接口/页面规则校验不通过！'},
		BAD_OUTPUT  : {code: 107, msg: '输出数据校验失败！'}
	},

	// 网络监控相关keys
	NET_MONITOR_KEYS: {
		STATE_NET   : 'network:connect:state', // 当前网络基本状态
		NET_LAST_TEST: 'network:connect:lastTestTime', // 上次检查网络状态时间
		POOL        : 'network:proxy:pool', // 代理池
	},

	// 网络状态
	NET_STATE       : {
		DISCONNECT  : -1, // 网络不通
		GOOD        : 1, // 通畅
	},

	TASK_STATUS     : {
		BIG_RECORD  : -2, // 查询条件下数据过多，需要再次分割
		ERROR       : -1, // 失败
		WAITING     : 0, // 等待
		RUNNING     : 1, // 运行中
		SUCCESS     : 2, // 成功
	},

	OUT_FILE_SIZE   : 500, // 输出out文件的大小

	// 过滤器类型
	FILTER_TYPE     : {
		SIMPLE      : 1, // 简单过滤器
		EXPIRE      : 2, // 带过期的过滤器
	}
};

// 读取config目录下所有配置文件，并合并到system当中
fs.readdirSync(__dirname).forEach(fileName => {
	let stats = fs.statSync(path.join(__dirname, fileName));

	if (!stats.isDirectory() && fileName.startsWith(`${ENV}_`) && fileName.endsWith('.js')) {
		let key = fileName.replace(`${ENV}_`, '').replace('.js', '').toUpperCase();
		let value = require(path.join(__dirname, fileName));
		config.hasOwnProperty(key) ? _.merge(config[key], value) : (config[key] = value);
	}
});

/**
 * 开发环境中需要实时监控网络状态；
 * 生产环境中可以保证网络稳定，因此不需要开启此功能；
 * @type {boolean}
 */
config.NET_CONNECT_TEST = ENV === 'development';

// 生产环境中禁止自定义的test选项
ENV === 'production' && config.SPIDER && config.SPIDER.test && (delete config.SPIDER.test);

module.exports = config;