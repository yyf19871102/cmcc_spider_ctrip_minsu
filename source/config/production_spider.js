/**
 * @auth yangyufei
 * @date 2018-12-15 17:22:35
 * @desc 爬虫相关配置
 */
module.exports = {
    outDir  : '/wltx/home/out/', // 输出文件根路径

	fetch   : {
		timeout     : 20000,
		retry       : 5,
	},

	task    : {
		concurrency : 20,
		retry       : 5,
	},

	run     : {
		type: 'forever',
	},
};