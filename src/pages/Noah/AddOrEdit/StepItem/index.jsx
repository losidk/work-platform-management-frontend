/**
 * 作业步骤最小单元
 * @returns {JSX.Element}
 * @constructor
 */

import {useState} from 'react';
import {Button, Switch, Spin} from '@osui/ui';
import {throttle} from 'lodash/fp';

import IconFont from '../../../../components/Iconfont';
import cx from './index.less';
import {EXECUTING_STATUS, URLS} from '../constants';
import {DEFAULT_SUCCESS_MESSAGE, REQUEST_CODE, REQUEST_METHODS, REQUEST_TYPE} from '../../../../constant';
import {request} from '../../../../request/fetch';
import {assembleRequestUrl, Toast} from '../../../../utils';

const StepItem = props => {
    const {name, handleClose, handleEdit, disabled, id: stageId, openStatus, isExecuting} = props;
    const [focus, setFocus] = useState(false);
    const [loading, setLoading] = useState(false);
    const [checked, setChecked] = useState(!!openStatus);

    const handleFocus = () => {
        setFocus(true);
    };

    const handleBlur = () => {
        setFocus(false);
    };

    // 切换启停
    const handleChangeExecution = throttle(500)(async e => {
        // openStatus	开关状态 0：关；1：开	query	true    integer(int32)
        // stageId	作业步骤ID	query	true    integer(int32)
        const {OPEN, CLOSE} = EXECUTING_STATUS;
        setLoading(true);
        const params = new FormData();
        params.append('openStatus', e ? OPEN : CLOSE);
        params.append('stageId', stageId);

        const res = await request({
            url: assembleRequestUrl(URLS.TOGGLE_EXECUTION),
            method: REQUEST_METHODS.PUT,
            type: REQUEST_TYPE.FORM_DATA,
            params,
        });
        setLoading(false);
        const {code} = res;
        if (code === REQUEST_CODE.SUCCESS) {
            Toast.success(DEFAULT_SUCCESS_MESSAGE);
            setChecked(e);
        }
    });

    return (
        <div
            className={cx('step-item', disabled ? 'disabled' : null)}
            onMouseEnter={handleFocus}
            onMouseLeave={handleBlur}
        >
            <span className={cx('icon')}>[/] </span>
            <span
                className={cx('main')}
                onClick={disabled ? null : handleEdit}
            >{name}
            </span>
            {
                isExecuting || disabled ? (
                    <div className={cx('executing')}>
                        <Spin spinning={loading}>
                            <Switch checked={checked} onChange={handleChangeExecution} />
                        </Spin>
                    </div>
                )
                    : (
                        <>
                            {/* 删除按钮 */}
                            {
                                !isExecuting && (
                                    <Button
                                        onClick={handleClose}
                                        type={'text'}
                                        icon={<IconFont type={'icondeleteorerror'} />}
                                        className={cx('close-button')}
                                    />
                                )
                            }
                            {/* 编辑按钮 */}
                            {!isExecuting && focus && (
                                <i
                                    className={cx('editing-button')}
                                    onClick={handleEdit}
                                />
                            )}
                        </>
                    )
            }
        </div>
    );
};

export default StepItem;
