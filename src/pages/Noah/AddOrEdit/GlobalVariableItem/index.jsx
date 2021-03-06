/**
 * 全局变量最小单元
 */

import {Button} from '@osui/ui';
import {omit} from 'ramda';
import {useCallback, useState} from 'react';

import IconFont from '../../../../components/Iconfont';
import cx from './index.less';
import VariableIcon from './VariableIcon';
import {GLOBAL_VARIABLE_TYPES} from '../constants';

const GlobalVariableItem = props => {
    const {name, type, value, handleClose, handleEdit, disabled} = props;
    const [focus, setFocus] = useState(false);

    const handleFocus = useCallback(() => {
        setFocus(true);
    }, []);

    const handleBlur = useCallback(() => {
        setFocus(false);
    }, []);

    const finalValue = type === GLOBAL_VARIABLE_TYPES.STRING.value
        ? value
        : '********';

    return (
        <div
            className={cx('global-variable-container', disabled ? 'disabled' : null)}
            onMouseEnter={handleFocus}
            onMouseLeave={handleBlur}
            onClick={disabled ? null : handleEdit}
        >
            <div className={cx('icon')}>
                <VariableIcon type={type} />
            </div>
            <div className={cx('right')}>
                <div className={cx('title')}>{name}</div>
                <div className={cx('sub-title')}>{finalValue}</div>
            </div>
            { !disabled && (
                <Button
                    onClick={e => {
                        e.stopPropagation();
                        handleClose(omit('handleClose', props));
                    }}
                    type={'text'}
                    icon={<IconFont type={'icondeleteorerror'} />}
                    className={cx('close-button')}
                />
            )}
            {!disabled && focus && (
                <i
                    className={cx('editing-button')}
                    onClick={handleEdit}
                />
            )}
        </div>
    );
};

export default GlobalVariableItem;

