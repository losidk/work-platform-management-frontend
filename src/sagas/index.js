import {put, all, takeLatest} from 'redux-saga/effects';

import {
    getExecutionDetail_A,
    getNoahList_A,
    getUsersFromOne_A,
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
    GET_USER_FROM_ONE_S,
    UPDATE_DISK_SPACE_INFO_S,
} from './types';
import {request} from '../request/fetch';
import {REQUEST_CODE, COMMON_URL_PREFIX, PROMISE_STATUS, GET_DATA_TYPES, DEFAULT_PAGINATION} from '../constant';
import {URLS} from '../pages/Exec/List/constant';

// 获取用户信息
function* getUsersFromOne() {
    let finalUsers = [];
    // TODO 生产环境动态化
    // if (IS_PROD) {
    //     finalUsers = yield request({
    //         url: `${ONE_URL_PREFIX}${GLOBAL_URLS.GET_USERS}`,
    //     });
    // } else {
    finalUsers = users;
    // }

    const usersMap = new Map();

    for (let i = 0; i < users.length; i++) {
        const {userId} = users[i];
        usersMap.set(userId, users[i]);
    }

    yield put(getUsersFromOne_A({
        list: finalUsers,
        map: usersMap,
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
    const res = yield request({
        // currentPage	当前页	query	false   integer(int32)
        // name	方案名称	query	false   string
        // pageSize	每页数据条数	query	false   integer(int32)
        // typeId	方案分类ID	query	false   integer(int32)
        // useTemp	是否为临时方案	query	false   integer(int32)
        // userName	创建人用户名	query	false   string
        url: `${COMMON_URL_PREFIX}${URLS.LIST}`,
        params: payload,
    });

    const {code, data: result} = res;

    if (code === REQUEST_CODE.SUCCESS) {
        const {list = [], total} = result;

        yield put(getNoahList_A({
            noahList: list.map(item => ({...item, key: item.id})),
            noahTotal: total,
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
    const {INIT} = GET_DATA_TYPES;
    const {type = INIT, currentPage} = payload;
    const res = yield request({
        url: `${COMMON_URL_PREFIX}${URLS.CATEGORIES}`,
        params: {
            // currentPage	当前页	query	false   integer(int32)
            // name	名称，模糊查询	query	false   string
            // pageSize	每页数据条数	query	false   integer(int32)
            currentPage,
            name: '',
            pageSize: DEFAULT_PAGINATION.pageSize,
        },
    });
    const {data, status} = res;
    if (!status) {
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
        takeLatest(GET_USER_FROM_ONE_S, getUsersFromOne),
        takeLatest(GET_EXECUTION_DETAIL_S, getExecutionDetail),
        takeLatest(GET_NOAH_LIST_S, getNoahList),
        takeLatest(GET_NOAH_DETAIL_S, getNoahWorkPlanDetail),
        takeLatest(UPDATE_CATEGORY_LIST_S, getCategoryList),
        takeLatest(UPDATE_DISK_SPACE_INFO_S, updateDiskSpaceInfo),
    ]);
};
