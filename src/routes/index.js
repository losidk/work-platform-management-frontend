import {BrowserRouter, Route, Routes} from 'react-router-dom';
import zhCN from 'antd/lib/locale/zh_CN';
import {ConfigProvider, message} from '@osui/ui';
import {useEffect} from 'react';
import {Provider} from 'react-redux';

import {CONTAINER_DOM_ID, PROJECT_ROUTE, PUBLIC_PATH} from '../constant';
import {getContainerDOM, getUrlPrefixReal} from '../utils';
import store from '../store';
import NoahList from '../pages/Noah/List/index';
import AddOrEditNoah from '../pages/Noah/AddOrEdit/index';
import ExecList from '../pages/Exec/List/index';
import CronList from '../pages/Cron/List/index';
import ExecLog from '../pages/Exec/StepLog';
import DiskSpace from '../pages/DiskSpace/index';

/**
 * 创建通用路由
 * @param url 路由路径
 * @param addProjectId
 * @param component 对应组件
 * @returns {JSX.Element}
 */

/**
 * 可以自动补全相关route的参数
 * @type {import("react-router-dom").BrowserRouterProps[]}
 */

const getRoute = ({url, addProjectId = false, component}) => {
    const URL_PREFIX_TEMP = addProjectId ? `:companyId/:projectId/${PROJECT_ROUTE}` : `:companyId/${PROJECT_ROUTE}`;

    return <Route key={url} path={`${PUBLIC_PATH}${URL_PREFIX_TEMP}/${url}`} element={component} exact />;
};

export const routes = {
    NOAH_LIST: {
        url: 'noah/list',
        component: <NoahList />,
    },
    NOAH_ADD: {
        url: 'noah/add',
        component: <AddOrEditNoah />,
    },
    NOAH_EDIT: {
        url: 'noah/:detailId',
        getUrl: id => `${getUrlPrefixReal()}/${routes.NOAH_EDIT.url.replace(':detailId', id)}`,
        component: <AddOrEditNoah />,
    },
    // 预执行
    NOAH_PRE_EXECUTING: {
        url: 'noah/exec/:detailId',
        getUrl: id => `${getUrlPrefixReal()}/${routes.NOAH_PRE_EXECUTING.url.replace(':detailId', id)}`,
        component: <AddOrEditNoah />,
    },
    EXEC_LIST: {
        url: 'exec/list',
        component: <ExecList />,
    },
    EXEC_LOG: {
        // detailId: 当前执行详情id, stepId， 详情中单个步骤id
        url: 'exec/step/log/:detailId/:executeId/:stepId',
        getUrl: (detailId, executeId, stepId) => `${getUrlPrefixReal()}/${routes.EXEC_LOG.url
            .replace(':detailId', detailId)
            .replace(':executeId', executeId)
            .replace(':stepId', stepId)}`,
        component: <ExecLog />,
    },
    CRON_LIST: {
        url: 'cron/list',
        component: <CronList />,
    },
    DISK_SPACE: {
        url: 'disk/space',
        component: <DiskSpace />,
    },
};

const App = () => {
    useEffect(() => {
        message.config({
            getContainer: getContainerDOM,
        });
        return () => {
            message.destroy();
        };
    }, []);
    return (
        <Provider store={store}>
            <ConfigProvider
                getPopupContainer={() => {
                    const node = getContainerDOM();
                    if (node) {
                        return node;
                    }
                    return document.body;
                }}
                locale={zhCN}
            >
                <div
                    data-theme="osui"
                    id={CONTAINER_DOM_ID}
                    className="osc-noah"
                    style={{height: '100%', maxHeight: '100vh', overflow: 'auto'}}
                >
                    <BrowserRouter>
                        <Routes>
                            {
                                Object.values(routes).map(item => {
                                    const {url, component} = item;
                                    return getRoute({url, component});
                                })
                            }
                            {
                                Object.values(routes).map(item => {
                                    const {url, component} = item;
                                    return getRoute({url, component, addProjectId: true});
                                })
                            }
                        </Routes>
                    </BrowserRouter>
                </div>
            </ConfigProvider>
        </Provider>
    );
};
export default App;
