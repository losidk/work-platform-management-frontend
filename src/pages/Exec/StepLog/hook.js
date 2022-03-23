import {useParams} from 'react-router-dom';
import {useCallback, useEffect, useMemo} from 'react';

import {IS_PROD} from '../../../constant';
import {DEVELOP_SA_LOG_PREFIX, SA_LOG_PREFIX} from './constant';

/**
 * 步骤日志 hook
 */
const useStepLog = (executionDetail, getExecutionDetail) => {
    const params = useParams();

    const getExecuteId = useCallback(() => {
        const {executeId} = params;
        getExecutionDetail(executeId);
    }, [getExecutionDetail, params]);
    const stageTriggerItemList = useMemo(() => {
        return executionDetail
            ?.stageTriggerList
            ?.filter(item => item.id === Number(params.stepId))[0]?.stageTriggerItemList || [];
    }, [executionDetail, params]);
    let dataSource = useMemo(() => {
        return stageTriggerItemList?.map(item => {
            const {stageTriggerItemParams, consumeTime, logUrl, runStatus} = item;
            const targetResource = stageTriggerItemParams?.targetResource;
            const id = stageTriggerItemParams.id;

            return targetResource ? {
                key: id,
                id: id,
                IP: targetResource?.targetResourceName,
                consumeTime,
                logUrl: IS_PROD ? logUrl : logUrl?.replace(SA_LOG_PREFIX, DEVELOP_SA_LOG_PREFIX),
                runStatus,
            } : null;
        });
    }, [stageTriggerItemList]);

    useEffect(() => {
        getExecuteId();
    }, [getExecuteId]);
    return {
        dataSource,
        params,
    };
};

export default useStepLog;