import cx from './index.less';
const SingleLineLog = ({content}) => {
    return <div className={cx('single-line-log')}>{content}{content}{content}</div>;
};

export default SingleLineLog;
