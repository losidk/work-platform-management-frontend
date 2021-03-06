// 执行记录
import {Drawer, Table} from '@osui/ui';
import {useEffect, useState} from 'react';
import {debounce} from 'lodash/fp';
import {reject, anyPass, isEmpty, isNil} from 'ramda';

import DateRangePicker from '../../../../components/DateRangePicker';
import {COMMON_URL_PREFIX} from '../../../../constant';
import {request} from '../../../../request/fetch';
import {URLS} from '../../constant';
import {convertConsumeTime, formatTimeStamp, requestCallback} from '../../../../utils';
import StatusTag from '../../../../components/StatusTag';
import cx from './index.less';
import {RUN_STATUSES} from '../../../Exec/List/constant';

const CronRecord = ({visible, recordId, onClose}) => {

    const defaultSearchValue = {
        startTime: '', endTime: '',
    };
    const [dataSource, setDataSource] = useState([]);
    const [searchValue, setSearchValue] = useState(defaultSearchValue);

    const handleChangeDate = debounce(500)(({startTime, endTime}) => {
        setSearchValue(value => ({
            ...value, startTime, endTime,
        }));
    });

    const getCronRecord = async () => {
        const params = reject(anyPass([isEmpty, isNil]))(searchValue);

        const res = await request({
            url: `${COMMON_URL_PREFIX}${URLS.CRON_RECORD}${recordId}`, params,
        });
        requestCallback({
            res, hideMessage: true, callback(data) {
                const {list, total} = data;
                setDataSource(list);
            },
        });
    };
    useEffect(() => {
        if (recordId) {
            getCronRecord();
        }
    }, [recordId, searchValue]);

    useEffect(() => {
        if (!visible) {
            setSearchValue(defaultSearchValue);
        }
    }, [visible]);
    const title = '执行记录';

    const recordProps = {
        columns: [{
            title: 'ID', dataIndex: 'id',
        }, {
            title: '任务状态', dataIndex: 'runStatus', align: 'center', render(status) {
                return (
                    <div className={cx('run-status')}>
                        {RUN_STATUSES.get(status).icon}
                        <StatusTag status={status} />
                    </div>
                );
            },
        }, {
            title: '开始时间', dataIndex: 'beginTime', render(val) {
                return formatTimeStamp(val);
            },
        }, {
            title: '耗时', dataIndex: 'consumeTime', render(val) {
                return convertConsumeTime({consumeTime: val}, false);
            },
        }], dataSource,
    };
    const drawerProps = {
        width: 720, title, visible, onClose,
    };
    return (
        <Drawer {...drawerProps}>
            {
                visible && (
                    <>
                        <DateRangePicker
                            handleChangeDate={handleChangeDate}
                        />
                        <Table {...recordProps} />
                    </>
                )
            }

        </Drawer>
    );
};

export default CronRecord;
