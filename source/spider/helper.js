/**
 * @author yangyufei
 * @date 2018-12-17 10:41:07
 * @desc
 */
const redis         = require('../db_manager/redis').redis;
const filterManager = require('../core/filter');
const logger        = require('../common/logger');

/**
 * 模拟产生老的filter数据
 * @returns {Promise<void>}
 */
const mockOldFilterData = async () => {
    const oldFilterKey  = 'spider-ctrip_minsu:filter:minsu-hotel';
    for (let i = 0 ; i < 533; i++) {
        await redis.hset(oldFilterKey, `no-${i}`, 'eee');
    }

    console.log('mock数据结束');
};

/**
 * 将老的过滤器里面的数据转移到新的过滤器里面
 * @returns {Promise<void>}
 */
const transFilterData = async () => {
    let {hotelFilter} = await filterManager.get();

    const oldFilterKey  = 'spider-ctrip_minsu:filter:minsu-hotel';
    const stream        = redis.hscanStream(oldFilterKey, {count: 100});

    let round = 0;
    stream.on('data', async (resultKeys) => {
        round += 1;
        logger.info(`开始第${round}轮`);
        for (let index = 0; index < resultKeys.length; index ++) {
            let key = resultKeys[index];
            index % 2 === 0 && await hotelFilter.exists(key);
        }
    });

    stream.on('end', function () {
        logger.info(`所有的过滤器数据转移完毕。`);
    });
};

transFilterData();