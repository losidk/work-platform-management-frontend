import {useNavigate} from 'react-router-dom';
import {useCallback, useEffect, useMemo, useRef} from 'react';
import {PageHeader, Button, message} from '@osui/ui';
import fileDownload from 'js-file-download';

import cx from '../index.less';
import HeaderDetailItem from '../../components/HeaderDetailItem';
import {convertConsumeTime, formatTimeStamp} from '../../../../utils';
import {FAILED, RUN_STATUSES} from '../../List/constant';
import {entirelyRetry, neglectErrors} from '../../List/ExecDetailDrawer/util';
import {LOG_CONTENT_SEPARATOR, MILLI_SECOND_STEP, PROMISE_STATUS} from '../../../../constant';
import {transformLogUrl} from '../constant';

const Header = ({executionDetail, params, dataSource, setAddStepDrawerVisible}) => {
    const navigate = useNavigate();
    const downloadTimer = useRef();
    const downloadButtonDisable = useMemo(() => {
        const length = dataSource.length;
        let availableCount = 0;
        for (let i = 0; i < length; i++) {
            const {errorInfo} = dataSource[i];
            if (!errorInfo) {
                return false;
            }
        }

        return !availableCount;
    }, [dataSource]);
    // 下载日志
    const downloadLog = async () => {
        const promises = dataSource.map(item => {
            const {logShowList, IP} = item;
            if (!logShowList) {
                return false;
            }
            return Promise.allSettled(logShowList.map(async logItem => {
                const {logUrl} = logItem;
                return fetch(transformLogUrl(logUrl)).then(
                    async res => {
                        const content = await res.text();
                        return {
                            content,
                            IP,
                        };
                    },
                );
            })).then(res => {
                let contentList  = [];
                let {IP} = res[0].value;
                let length = res.length;
                for (let i = 0; i < length; i++) {
                    const {status, value: {content}} = res[i];
                    if (status === PROMISE_STATUS.FULFILLED) {
                        contentList.push(content);
                    }
                }
                fileDownload(contentList.join(LOG_CONTENT_SEPARATOR), `${IP}.log`);
                return res;
            });
        }).filter(Boolean);
        const res = await Promise.allSettled(promises);
        const failedCount = res.filter(item => item.status !== PROMISE_STATUS.FULFILLED).length;
        const length = res.length;

        downloadTimer.current = setTimeout(() => {
            if (failedCount < length) {
                message.success(`当前日志下载完成，成功${length - failedCount}个，失败${failedCount}个`);
            } else if (failedCount === length) {
                message.error('当前日志下载失败');
            }
        }, [MILLI_SECOND_STEP]);

    };

    const stepDetail = useMemo(() => {
        return executionDetail?.stageTriggerList?.filter(item => item.id === Number(params?.stepId))[0];
    }, [executionDetail?.stageTriggerList, params?.stepId]);

    const runStatus = useMemo(() => {
        //    runStatus	执行状态 1：待执行；2：执行中；3：执行失败；4：执行成功；5：执行暂停；
        return (
            <span className={cx('execute-status', `status-${stepDetail?.runStatus}`)}>
                {RUN_STATUSES.get(stepDetail?.runStatus)?.label}
            </span>
        );

    }, [stepDetail?.runStatus]);

    const errorOperations = [
        {
            label: '全部主机重试',
            execution: () => entirelyRetry({id: params?.stepId}),
        },
        {
            label: '忽略错误',
            execution: neglectErrors,
        },
    ];

    const operations = [
        {
            label: '下载日志', // 下载日志，下载所有的IP执行日志，是压缩文件，一个ip一个txt文档 (from product manager)
            execution: downloadLog,
            disabled: downloadButtonDisable,
        },
        {
            label: '查看步骤内容',
            execution: () => setAddStepDrawerVisible(true),
            type: 'primary',
        },
    ];

    if (executionDetail?.runStatus === FAILED.value) {
        operations.unshift(...errorOperations);
    }

    const userName = useMemo(() => {
        return executionDetail?.userName;
    }, [executionDetail]);


    const title = useMemo(() => {
        return stepDetail?.name;
    }, [stepDetail?.name]);

    const beginTime = useMemo(() => {
        const beginTime = stepDetail?.beginTime;
        return formatTimeStamp(beginTime);
    }, [stepDetail?.beginTime]);

    const headerDetail = [
        {
            label: '发起人：',
            value: userName,
        },
        {
            label: '发起时间：',
            value: beginTime,
        },
        {
            label: '状态：',
            value: runStatus,
        },
        {
            label: '总耗时：',
            value: convertConsumeTime(stepDetail),
        },
    ];

    const goBack = useCallback(() => {
        navigate(-1);
    }, [navigate]);

    useEffect(() => {
        return () => {
            clearTimeout(downloadTimer.current);
        };
    }, []);

    return (
        <PageHeader
            onBack={goBack}
            title={title}
            className={cx('fundamental-info')}
            extra={operations.map(operation => (
                <Button
                    disabled={operation.disabled}
                    key={operation.label}
                    type={operation.type || 'default'}
                    onClick={() => operation.execution(executionDetail)}
                >{operation.label}
                </Button>
            ))}
        >
            <div className={cx('desc-container')}>
                {headerDetail.map(item => (<HeaderDetailItem key={item?.label} item={item} />))}
            </div>
        </PageHeader>
    );
};

export default Header;
