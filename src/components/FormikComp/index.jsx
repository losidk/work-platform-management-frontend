/**
 * formik 表单与 antd 的二次封装
 */

import {Formik} from 'formik';
import React, {useRef} from 'react';
import {debounce, isEqual, set} from 'lodash/fp';
import * as yup from 'yup';
import {omit} from 'ramda';
import {Button} from '@osui/ui';

import FormField from '../FormField';
import cx from './index.less';

/**
 *
 * @param initialValues
 * @param handleOk
 * @param formFields
 * @returns {JSX.Element}
 * @constructor
 */
const FormikComp = ({
    initialValues,
    handleSubmit,
    formFields,
    Footer,
    disabled,
    setDisabled,
    needFooter = true,
    handleCancel,
    okText = '确定',
}) => {

    const validateObj = Object.values(formFields).reduce((prev, curr) => {
        prev[curr.name] = curr.validate;
        return prev;
    }, {});

    const refOfValues = useRef();

    validateObj.grantGroups = yup.array();

    const validateSchema = yup.object().shape(validateObj);
    const handleFinalChange = debounce(250)((values, valid) => {
        setDisabled(!valid);
    });
    const validate = values => {
        try {
            validateSchema.validateSync(values, {abortEarly: false});
            return {};
        } catch (e) {
            const errors = e.inner.reduce((acc, cur) => set(
                cur.path,
                // 如果希望某些特定的条件下level不是error，而是warning，
                // 请修改下面的逻辑，根据yup的返回结果进行适配
                cur.errors.map(v => ({level: 'error', text: v})),
                acc,
            ), {});
            return errors;
        }
    };

    const DefaultFooter = () => {
        return (
            <>
                <Button
                    type={'primary'}
                    disabled={disabled}
                    onClick={handleSubmit}
                    className={cx('submit-button', 'button')}
                >{okText}
                </Button>
                <Button
                    className={cx('button')}
                    onClick={handleCancel}
                >取消
                </Button>
            </>
        );
    };

    const FinalFooter = Footer || DefaultFooter;

    return (
        <Formik
            enableReinitialize
            validate={validate}
            initialValues={initialValues}
            onSubmit={handleSubmit}
        >
            {({values}) => {
                const valid = validateSchema.isValidSync(values);
                if (!refOfValues.current || (refOfValues.current && !isEqual(refOfValues.current, values))) {
                    handleFinalChange(values, valid);
                }
                refOfValues.current = values;
                return (
                    <>
                        {
                            Object.values(formFields).map(({
                                name,
                                label,
                                children,
                                ...rest
                            }) => {
                                return (
                                    <FormField name={name} label={label} key={label} {...omit('validate', rest)}>
                                        {
                                            children
                                        }
                                    </FormField>
                                );
                            })
                        }
                        {needFooter && <FinalFooter />}
                    </>
                );
            }}
        </Formik>
    );
};

export default FormikComp;
