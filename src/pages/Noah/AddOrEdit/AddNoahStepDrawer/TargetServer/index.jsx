import {Radio, Spin, TreeSelect} from '@osui/ui';
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {clone} from 'ramda';

import {AGENT_STATUS, AGENT_TERMINAL_TYPE, LABEL_TYPE, URL_PREFIX1, URL, GROUP_TYPES} from '../../constants';
import {debounce, getURlWithPrefix} from '../../../../../utils';
import {getCompanyId, getSpaceId} from '../../../../../utils/getRouteIds';
import {request} from '../../../../../request/fetch';
import cx from './index.less';
import {agents, labels} from '../../../../../temp/agents';

const getAgentMap = agents => {
    const tempMap = {};
    const agentMapByUuid = {};
    for (let i = 0; i < agents.length; i++) {
        const agent = agents[i];
        agent.title = agent.name;
        agent.value = agent.uuid;
        agent.key = agent.uuid;
        agent.disabled = agent.status !== AGENT_STATUS.ONLINE;

        const tempObj = tempMap[agent.labelId];
        agentMapByUuid[agent.uuid] = agent;
        if (tempObj) {
            const {activeCount: originActiveCount, list: originList, totalCount: originTotalCount} = tempObj;
            tempMap[agent.labelId] = {
                list: [...originList, agent],
                activeCount: agent.status === AGENT_STATUS.ONLINE ? originActiveCount + 1 : originActiveCount,
                totalCount: originTotalCount + 1,
            };
        } else {
            tempMap[agent.labelId] = {
                list: [agent],
                activeCount: agent.status === AGENT_STATUS.ONLINE ? 1 : 0,
                totalCount: 1,
            };
        }
    }
    return {
        tempMap,
        agentMapByUuid,
    };
};

const formatChildNodes = (label, agentObj = {list: [], activeCount: 0, totalCount: 0}) => {
    const tempObj = clone(label);
    const {deleteStatus} = tempObj;
    tempObj.children = agentObj.list;
    tempObj.activeCount = !deleteStatus ? agentObj.activeCount : 0;
    tempObj.totalCount = agentObj.totalCount;

    return tempObj;
};

// label 处理
const formatLabels = (agentMap, labels, currentType) => {
    const labelMap = {};
    const tempLabels = labels.map(label => {
        let tempLabel = clone(label);
        const {id, type} = tempLabel;
        if (currentType !== type) {
            return null;
        };
        const tempAgentObj = agentMap[id];
        tempLabel = formatChildNodes(tempLabel, tempAgentObj);
        const {totalCount, activeCount, labelType, displayName} = tempLabel;
        const labelTypeVal = labelType ? LABEL_TYPE[labelType] : '';

        tempLabel.title = (
            <div
                className={cx('tree-data-parent')}
            >
                <div className={cx('left-content')}>
                    <span className={cx('content')}>{displayName}</span>
                    <span className={cx('tree-data-parent-show')}>
                        {`（${activeCount}/${totalCount}）`}
                    </span>
                </div>
                <span className={cx('tree-data-parent-show')}>
                    {
                        typeof labelTypeVal === 'string'
                            ? <span className={cx(`type-${labelType}`)}>{labelTypeVal}</span>
                            : (
                                labelTypeVal.map((item, index) => (
                                    <span
                                        key={`${+new Date()}_${index + 1}`}
                                        className={cx(`type-${index + 1}`)}
                                    >
                                        {item}
                                    </span>
                                ))
                            )
                    }
                </span>
            </div>
        );
        tempLabel.value = label.id;
        tempLabel.key = label.id;
        labelMap[label.id] = tempLabel;
        return tempLabel;
    });
    return {
        tempLabels,
        labelMap,
        agentMap,
    };
};

const formatData = (agents, labels, currentType) => {
    const {agentMapByUuid, tempMap: agentMap} = getAgentMap(agents);
    return {
        ...formatLabels(agentMap, labels, currentType),
        agentMapByUuid,
    };
};

const TargetServer = ({field, handleChange}) => {
    const companyId = getCompanyId();
    const spaceId = getSpaceId();

    const [needUpdate, setNeedUpdate] =  useState(false);
    const [loading, setLoading] = useState(false);

    const [treeData, setTreeData] = useState([]);
    const [labelMap, setLabelMap] = useState({});
    const [agentMap, setAgentMap] = useState({});
    const [agentMapByUuid, setAgentMapByUuid] = useState({});
    const [type, setType] = useState(AGENT_TERMINAL_TYPE.LINUX.value);
    const [labelName, setLabelName] = useState('');

    const handleSearch = useCallback(debounce(e => {
        setLabelName(e);
    }, 500), []);

    const handleChangeType = useCallback(e => {
        handleSearch('');
        setType(e.target.value);
    }, [handleSearch]);


    const isEnterPriseType =  useMemo(() => {
        return getSpaceId() === '';
    }, [getSpaceId]);

    const groupType = useMemo(() => {
        return isEnterPriseType ? GROUP_TYPES.ENTERPRISE : GROUP_TYPES.PROJECT;
    }, [isEnterPriseType]);

    const fetchAgents = useCallback(async () => {
        // setOriginDataUpdated(true);
        return request({
            url: getURlWithPrefix(URL_PREFIX1, URL.AGENTS),
            params: {
                // companyId: 'xly-poc',
                companyId,
                // linux, windows
                type,
                workspaceId: 'xly-poc',
                // workspaceId: companyId,
                groupName: spaceId,
                // groupName: 'iPipe',
                groupType,
            },
        });
    }, [type, spaceId, groupType, companyId]);

    // labelName    主机名称模糊查询
    // groupName    group名称模糊查询
    // groupType    1 企业 2 组织
    // labelType    用途 1 执行 2 部署 3 执行且部署
    // type         系统 1 win 2 linux
    // companyUuid  租户标识
    // currentPage  当前页
    // pageSize     页大小
    const fetchLabels = useCallback(async () => {
        return request({
            url: getURlWithPrefix(URL_PREFIX1, URL.LABELS),
            params: {
                // groupName: 'xly-poc',
                // groupName: spaceId,
                groupName: '',
                groupType,
                currentPage: '0',
                pageSize: '10000',
                workspaceId: spaceId,
                // labelName: updateType ? '' : labelName,
                labelName,
                labelLevel: '',
            },
        });
    }, [groupType, spaceId, labelName]);

    const updateData = useCallback(() => {
        if (!needUpdate) {
            return;
        }
        setNeedUpdate(false);
        setLoading(true);
        setTreeData([]);
        Promise.all([fetchAgents(), fetchLabels()]).then(([agentRes, labelRes]) => {
            // const {status: agentStatus, entities: {agents = []}} = agentRes;
            setLoading(false);

            // const {status: labelStatus, list: labels} = labelRes;

            // if (!agentStatus && !labelStatus) {
            const {labelMap, tempLabels: treeData, agentMap, agentMapByUuid} = formatData(agents, labels, type);
            setTreeData(treeData.filter(item => item));
            setAgentMap(agentMap);
            setLabelMap(labelMap);
            setAgentMapByUuid(agentMapByUuid);
            // }
        });
    }, [needUpdate, fetchAgents, fetchLabels, type]);

    const getActiveAgentInfoByLabel = useCallback(labelId => {
        const label = labelMap[labelId];
        if (label.deleteStatus) {
            return [];
        }
        const children = label?.children;
        const length = children?.length;
        const res = [];
        for (let i = 0; i < length; i++) {
            const child = children[i];
            if (child?.status === AGENT_STATUS.ONLINE) {
                res.push(child);
            }
        }
        return res;
    }, [labelMap]);

    const onChange = useCallback(e => {
        const agents = [];
        for (let i = 0; i < e.length; i++) {
            if (typeof e[i] === 'number') {
                agents.push(...getActiveAgentInfoByLabel(e[i]));
            } else {
                agents.push(agentMapByUuid[e[i]]);
            }
        }
        handleChange(agents);
    }, [agentMapByUuid, getActiveAgentInfoByLabel, handleChange]);

    useEffect(() => {
        updateData();
    }, [needUpdate]);

    useEffect(debounce(() => {
        setNeedUpdate(true);
    }, 500), [labelName]);

    useEffect(() => {
        setNeedUpdate(true);
    }, [type]);

    return (
        <TreeSelect
            showSearch
            className={cx('agent-select-tree')}
            dropdownStyle={{maxHeight: 400, overflow: 'auto', width: '100%'}}
            placeholder="请选择目标服务器"
            showArrow
            allowClear
            multiple
            // open
            onSearch={handleSearch}
            treeData={treeData}
            filterTreeNode={false}
            onChange={onChange}
            getPopupContainer={triggerNode => triggerNode.parentNode}
            treeDefaultExpandAll
            dropdownClassName={cx('agent-select-tree-dropdown')}
            dropdownRender={(originNode, props) => {
                return (
                    <>
                        <div className={cx('dropdown-custom-content')}>
                            <Radio.Group
                                options={Object.values(AGENT_TERMINAL_TYPE)}
                                value={type}
                                onChange={handleChangeType}
                                optionType="button"
                            />
                        </div>
                        <Spin spinning={loading}>
                            {originNode}
                        </Spin>
                    </>
                );
            }}
            {...field}
        />
    );
};

export default TargetServer;