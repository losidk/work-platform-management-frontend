import {put, all, takeLatest} from 'redux-saga/effects';
import {omit} from 'ramda';

import {
    getExecutionDetail_A,
    updateNoahList_A,
    updateUsersFromOne_A,
    getNoahDetail_A,
    updateCategories_A,
    updateDiskSpaceInfo_A,
} from '../actions/actionCreators.js';
import {users} from '../temp/users';
import {
    UPDATE_CATEGORY_LIST_S,
    GET_EXECUTION_DETAIL_S,
    GET_NOAH_DETAIL_S,
    GET_NOAH_LIST_S,
    UPDATE_USER_FROM_ONE_S,
    UPDATE_DISK_SPACE_INFO_S,
} from './types';
import {request} from '../request/fetch';
import {
    REQUEST_CODE,
    COMMON_URL_PREFIX,
    PROMISE_STATUS,
    TYPES_OF_FEATING,
    DEFAULT_PAGINATION,
    GLOBAL_URLS,
    IS_PROD,
    GLOBAL_URL_PREFIX,
} from '../constant';
import {URLS} from '../pages/Exec/List/constant';
import {getURlWithPrefix} from '../utils';

// 获取用户信息
function* updateUserFromOne({payload}) {
    const {INIT} = TYPES_OF_FEATING;
    const {currentPage = 0, type = INIT} = payload;
    let finalUserObj;
    let finalUsers;
    if (IS_PROD) {
    // TODO 生产环境动态化
        finalUserObj = yield request({
            url: getURlWithPrefix(GLOBAL_URL_PREFIX, GLOBAL_URLS.GET_USERS),
            params: {
                applyStatus: '',
                name: '',
                userType: 'USER',
                groupId: '',
                directoryId: '',
                title: '',
                _offset: currentPage,
                _limit: DEFAULT_PAGINATION.pageSize,
            },
        });
        finalUserObj = omit(['status', 'msg'], finalUserObj);
        finalUserObj.length = Object.keys(finalUserObj).length;
        finalUsers = Array.from(finalUserObj);
    } else {
        finalUsers = users;
    }

    const usersMap = new Map();

    for (let i = 0; i < users.length; i++) {
        const {userId} = users[i];
        usersMap.set(userId, users[i]);
    }

    yield put(updateUsersFromOne_A({
        list: finalUsers,
        map: usersMap,
        type,
    }));
}

// 获取执行详情
function* getExecutionDetail({payload}) {
    const res = yield request({
        url: `${COMMON_URL_PREFIX}${URLS.GET_EXECUTION_DETAIL}${payload}`,
    });
    const {code, data} = res;
    if (code === REQUEST_CODE.SUCCESS) {
        yield put(getExecutionDetail_A(data));
    } else {
        yield put(getExecutionDetail_A(null));
    }
}

// 获取作业方案列表
function* getNoahList({payload}) {
    const {INIT} = TYPES_OF_FEATING;
    const {type = INIT, pageSize = DEFAULT_PAGINATION.pageSize} = payload;
    const res = yield request({
        url: `${COMMON_URL_PREFIX}${URLS.LIST}`,
        params: {
            pageSize,
            ...omit(['type'], payload),
        },
    });

    const {code, data: result} = res;
    if (code === REQUEST_CODE.SUCCESS) {
        const {list = [], total, currentPage} = result;

        yield put(updateNoahList_A({
            type,
            list: list.map(item => ({...item, key: item.id})),
            total: total,
            currentPage,
        }));
    }
}

function* getNoahWorkPlanDetail({payload}) {
    const res = yield request({
        url: `${COMMON_URL_PREFIX}${URLS.GET_NOAH_WORK_PLAN_DETAIL}${payload}`,
    });
    const {code, data} = res;
    if (code === REQUEST_CODE.SUCCESS) {
        yield put(getNoahDetail_A(data));
    }
}

function* getCategoryList({payload = {currentPage: 1}}) {
    const {INIT} = TYPES_OF_FEATING;
    const {type = INIT, currentPage} = payload;
    const res = yield request({
        url: `${COMMON_URL_PREFIX}${URLS.CATEGORIES}`,
        params: {
            currentPage,
            pageSize: DEFAULT_PAGINATION.pageSize,
            ...omit(['type'], payload),
        },
    });
    const {data, code} = res;
    if (code === REQUEST_CODE.SUCCESS) {
        const {list, currentPage} = data;

        yield put(
            updateCategories_A({
                categories: {
                    list,
                    currentPage,
                },
                type,
            }));
    }
}

function* updateDiskSpaceInfo() {
    const res = yield request({
        url: `${COMMON_URL_PREFIX}${URLS.DISK_SPACE_INFO}`,
    });
    const res1 = yield request({
        url: `${COMMON_URL_PREFIX}${URLS.CHECK_DISK_SPACE}`,
    });
    const resList = yield Promise.allSettled([res, res1]);
    let info = {};
    resList.forEach(res => {
        const {value, status} = res;
        if (status === PROMISE_STATUS.FULFILLED) {
            info = {
                ...info,
                ...value?.data,
            };
        }
    });
    yield put(
        updateDiskSpaceInfo_A(info),
    );
}

export default function* () {
    yield all([
        takeLatest(UPDATE_USER_FROM_ONE_S, updateUserFromOne),
        takeLatest(GET_EXECUTION_DETAIL_S, getExecutionDetail),
        takeLatest(GET_NOAH_LIST_S, getNoahList),
        takeLatest(GET_NOAH_DETAIL_S, getNoahWorkPlanDetail),
        takeLatest(UPDATE_CATEGORY_LIST_S, getCategoryList),
        takeLatest(UPDATE_DISK_SPACE_INFO_S, updateDiskSpaceInfo),
    ]);
};
