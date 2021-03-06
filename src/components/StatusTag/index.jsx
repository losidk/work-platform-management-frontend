/**
 *  任务状态Tag
 */
import React from 'react';
import cx from './index.less';

const statuses = [{
    index: 0,
    label: '未开始',
    color: '#0C62FF',
    bgColor: '#E2ECFF',
}, {
    index: 1,
    label: '执行中',
    color: '#854800',
    bgColor: 'rgba(255, 139, 0, 0.3)',
}, {
    index: 2,
    label: '失败',
    color: '#FF5630',
    bgColor: '#FFEBE5',
}, {
    index: 3,
    label: '成功',
    color: '#00875A',
    bgColor: '#E2FFEE',
}, {
    index: 4,
    label: '执行暂停',
    color: '#909AAA',
    bgColor: '#E9EAEC',
}];

const StatusTag = ({status}) => {
    const currentStatus = statuses[status - 1];
    const {label, color, bgColor: backgroundColor} = currentStatus;
    return (
        <span
            className={cx('noah-status-tag')}
            style={{color, backgroundColor}}
        >
            {label}
        </span>
    );
};

export default StatusTag;
