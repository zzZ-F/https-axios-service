import axios from 'axios';

class Https {
    constructor(config = {}) {

        this.getToken = config.getToken; // 获取token的方法 初始化时候若不传则认为是共有方法
        this.tokenHeaderKey = config.tokenHeaderKey || 'Authorization'; //token  header key
        this.tokenKey = config.tokenKey || 'Bearer '; // token 拼接字符串
        this.loading = config.loading !== false; // 是否显示loading
        this.rejectCallback = config.rejectCallback; // 请求失败处理
        this.api = config.api; // 地址
        this.successCallback = config.successCallback; // 请求成功处理
        this.showLoading = config.showLoading; // loading ui和显示
        this.removeLoading = config.removeLoading; // 移除loading ui
        this.requestCount = 0;
        this.requiredParams('api') // 必填项验证
        this.instance = axios.create({
            baseURL: this.api,
            timeout: config.timeout || 3000,
            headers: config.headers || {
                'Accept': 'application/json',
            }
        })
    }

    requiredParams() {
        for (let i = 0; i < arguments.length; i++) {
            if (!(this[arguments[i]])) {
                throw new Error(arguments[i] + ' is a required params');
            }
        }
    }


    setLoading() {
        if (!this.loading) return;
        if (this.requestCount === 0) {
            this.showLoading && this.showLoading()
        }
        this.requestCount++;
    }

    hideLoading() {
        if (!this.loading) return;
        this.requestCount--
        if (this.requestCount === 0) {
            this.removeLoading && this.removeLoading();
        }
    }

    handleError(error) {
        if (axios.isCancel(error)) { // 如果是用户主动取消的
            return;
        }
        if (error) { // 服务器错误
            this.rejectCallback && this.rejectCallback(error);
        }
    }

    getBaseURL() {
        return this.api;
    }

    request(params) {
        if (!params || Object.prototype.toString.call(params) !== "[object Object]") {
            throw new Error("params is undefined or not an object")
        }
        //设置私有接口Authorization
        if (this.getToken) {
            let token = this.getToken && this.getToken();
            this.instance.defaults.headers.common[this.tokenHeaderKey] = this.tokenKey + token;
        } else {
            delete this.instance.defaults.headers.common[this.tokenHeaderKey];
        }

        return new Promise((resolve, reject) => {
            let that = this;
            this.instance.request(params).then(res => {
                that.hideLoading()
                if (res.status === 200) {
                    resolve(res.data);
                    return;
                }
                this.successCallback && this.successCallback(res)
            }).catch(error => {
                that.hideLoading()
                that.handleError(error);
                reject(error);
            });
        });
    }

    getConfig(method, url, data) {
        let params = {
            url: url,
            method: method
        };
        if (method === 'get') {
            data && (params.params = data);
        } else {
            data && (params.data = data);
        }
        return params;
    }

    get(url, data) {
        this.setLoading()
        let params = this.getConfig('get', url, data);
        return this.request(params);
    }

    post(url, data) {
        this.setLoading()
        let params = this.getConfig('post', url, data);
        return this.request(params);
    }

    put(url, data) {
        this.setLoading()
        let params = this.getConfig('put', url, data);
        return this.request(params);
    }

    delete(url, data) {
        this.setLoading()
        let params = this.getConfig('delete', url, data);
        return this.request(params);
    }

}

export default Https