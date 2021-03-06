import {message} from '@osui/ui';

import {getCompanyId, getSpaceId} from './getRouteIds';
import {
    CONTAINER_DOM_ID,
    DEFAULT_STRING_VALUE,
    TYPES_OF_FEATING,
    HOUR_STEP,
    MAGE_BYTE_SCALE,
    MILLI_SECOND_STEP,
    MINUTE_STEP,
    PROJECT_ROUTE,
    PUBLIC_PATH,
    REQUEST_CODE,
} from '../constant';

const formatWidthEero = (origin, maxLength, fillString) => {
    return String(origin).padStart(maxLength, fillString);
};

const formatTime = origin => {
    return formatWidthEero(origin, 2, '0');
};
export const formatTimeStamp = (timestamp, dateSymbol = '-', timeSymbol = ':') => {
    if (!timestamp) {
        return DEFAULT_STRING_VALUE;
    }
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = formatTime(date.getMonth() + 1);
    const day = formatTime(date.getDate());
    const hour = formatTime(date.getHours());
    const minute = formatTime(date.getMinutes());
    const second = formatTime(date.getSeconds());
    return `${year}${dateSymbol}${month}${dateSymbol}${day} ${hour}${timeSymbol}${minute}${timeSymbol}${second}`;
};
/**
 * @param dateTimeStamp
 * @returns {{hourTime: number, secondTime: number, minuteTime: number, dayTime: number}}
 */
export const getDateTime = dateTimeStamp => {

    const parseIntForDecimal = str => parseInt(str, 10);
    // 获取总秒数
    let secondTime = parseIntForDecimal(dateTimeStamp / MILLI_SECOND_STEP);
    let dayTime = 0; // 天
    let minuteTime = 0; // 分
    let hourTime = 0; // 小时

    // 如果秒数大于60，将秒数转换成整数
    if (secondTime >= MINUTE_STEP) {
        // 获取分钟，除以60取整数，得到整数分钟
        minuteTime = parseIntForDecimal(secondTime / MINUTE_STEP);
        // 获取秒数，秒数取佘，得到整数秒数
        secondTime = parseIntForDecimal(secondTime % MINUTE_STEP);
        // 如果分钟大于60，将分钟转换成小时
        if (minuteTime >= MINUTE_STEP) {
            // 获取小时，获取分钟除以60，得到整数小时
            hourTime = parseIntForDecimal(minuteTime / MINUTE_STEP);
            // 获取小时后取佘的分，获取分钟除以60取佘的分
            minuteTime = parseIntForDecimal(minuteTime % MINUTE_STEP);
        }
        if (hourTime >= HOUR_STEP) {
            dayTime = parseIntForDecimal(hourTime / HOUR_STEP);
            hourTime = parseIntForDecimal(hourTime % HOUR_STEP);
        }
    }
    return {
        dayTime,
        hourTime,
        minuteTime,
        secondTime,
    };
};

export function getContainerDOM() {
    return document.getElementById(CONTAINER_DOM_ID);
}

export function getURlWithPrefix(prefix, url) {
    return `${prefix}${url}`;
}

export function getUrlPrefixReal() {
    const companyId = getCompanyId();
    const projectId = getSpaceId();
    const PREFIX = projectId ? `${PUBLIC_PATH}${companyId}/${projectId}` : `${PUBLIC_PATH}${companyId}`;
    return `${PREFIX}/${PROJECT_ROUTE}`;
}

export const byteToGage = size => {
    return (size / Math.pow(MAGE_BYTE_SCALE, 3)).toFixed(2);
};

/**
 * 转换为 MB
 * @param fileSize 单位 byte
 */
export function convertFileSize(fileSize) {
    let size = 0;
    let symbol = 'byte';
    const doubleUnit = Math.pow(MAGE_BYTE_SCALE, 2);
    const treblingUnit = Math.pow(MAGE_BYTE_SCALE, 3);
    if (fileSize < doubleUnit) {
        size = fileSize / MAGE_BYTE_SCALE;
        symbol = 'Kb';
    } else if (fileSize <= treblingUnit) {
        size = fileSize / doubleUnit;
        symbol = 'Mb';
    } else {
        size = byteToGage(fileSize);
        symbol = 'Gb';
    }
    return `${size.toFixed(2)}${symbol}`;
}

// 换算总耗时
export function convertConsumeTime(executionDetail, needDefaultDate = true) {
    if (!executionDetail) {
        return;
    }
    let {consumeTime = null, beginTime} = executionDetail;
    if (needDefaultDate) {
        if (!consumeTime) {
            if (beginTime) {
                consumeTime = (Date.now() - beginTime) / MILLI_SECOND_STEP;
            } else {
                return DEFAULT_STRING_VALUE;
            }
        }
    } else if (!consumeTime) {
        return DEFAULT_STRING_VALUE;
    }

    const {
        dayTime,
        hourTime,
        minuteTime,
        secondTime,
    } = getDateTime(consumeTime * MILLI_SECOND_STEP);
    const dateStr = dayTime ? `${dayTime}d` : '';
    const hourStr = hourTime ? `${hourTime}h` : '';
    const minuteStr = minuteTime ? `${minuteTime}m` : '';
    const secondStr = secondTime ? `${secondTime}s` : '';
    return `${dateStr}${hourStr}${minuteStr}${secondStr}`;
}

export function requestCallback({
    res,
    hideMessage = false,
    successMessage = '操作成功',
    callback,
    errorCallback,
}) {
    const {code, msg, data} = res;
    if (code === REQUEST_CODE.SUCCESS) {
        if (!hideMessage) {
            message.success(successMessage || msg);
        }
        callback && callback(data);
    } else {
        errorCallback && errorCallback(data);
    }
}

export const TYPE_MESSAGES = {
    APP: 'app',
    DISK_SPACE: 'diskSpace',
};
export const diskWarning = (diskSpaceInfo, type = 'app') => {
    if (!diskSpaceInfo) {
        return;
    }
    let {diskFreeSize, diskUsedWarnRatio, diskTotalSize, overstep} = diskSpaceInfo;

    const freeRatio = diskFreeSize / diskTotalSize;
    const {APP, DISK_SPACE} = TYPE_MESSAGES;
    const typeMessages = {
        [APP]: `存储空间已占用${(freeRatio * 100).toFixed(2)}%！，请删除历史方案和定时任务，清理磁盘空间，否则无法创建执行方案！`,
        [DISK_SPACE]: `磁盘剩余空间还剩 ${(freeRatio * 100).toFixed(2)}% ，
        请及时清理历史任务和定时任务。如果超过 ${diskUsedWarnRatio * 100}% 磁盘占用，用户将无法创建作业方案和定时任务！`,
    };

    if (overstep) {
        message.warning(typeMessages[type]);
    }
};

export const updateCategoryMap = list => {
    const length = list.length;
    const map = {};
    for (let i = 0; i < length; i++) {
        const {name = '', id} = list[i];
        map[name] = list[i];
        map[id] = list[i];
    }
    return map;
};

export const loadMoreCallBackByScrolling = ((e, {dispatch, currentPage: categoryCurrentPage, params}) => {
    e.persist();
    // 判断滑动到底部
    const {scrollTop, scrollHeight, clientHeight} = e.target;
    if (Math.ceil(scrollTop + clientHeight) >= scrollHeight) {
        dispatch({
            currentPage: categoryCurrentPage + 1,
            type: TYPES_OF_FEATING.MORE,
            ...params,
        });
    }
});





















