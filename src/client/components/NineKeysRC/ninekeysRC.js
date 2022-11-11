import { FullscreenExitOutlined, FullscreenOutlined, SettingOutlined } from '@ant-design/icons';
import { Card, Col, Divider, Drawer, Form, InputNumber, Row, Space, Switch } from 'antd';
import 'antd/dist/antd.css';
import React, { useEffect, useRef, useState, useReducer } from 'react';
import { FullScreen, useFullScreenHandle } from "react-full-screen";
import io from 'socket.io-client';
// import pinyinIME from './pinyinIME';
import Selector from './Selector';



const ChineseIME = (props) => {
    // const IME = new pinyinIME();
    const [showSettings, setShowSettings] = useState(false);
    const fullScreenHandle = useFullScreenHandle();

    //level 0: ab cd ef g    1: hi jk lm n   2 op qr st   3  uv wx yz
    //确定 1
    //取消
    // state: 
    //   message: 
    //   candidates, candidatePos,
    //   input: 已输入的拼音串，待解码
    //   level
    //   currentInput
    //   status: 'idle'(level:-1) -> 'input' (level, prefix[]) -> 'candidates'

    const actionToIndex = (action) => {
        const actionData = ['click', 'up', 'right', 'down', 'left'];
        let idx = actionData.indexOf(action);
        if (idx < 0) idx = 0;
        return idx;
    }
    const getCandidateMsg = (candidates, startPos) => {
        const size = 3;
        while (startPos + size > candidates.length) {
            candidates.push('');
        }
        return [candidates[startPos + 0], candidates[startPos + 1], '下一页', candidates[startPos + 2], startPos == 0? '取消': '上一页'];
    }
    const getCharMsg = (ch) => {
        let len = Math.floor((ch.length + 3) / 4);
        let ret = ['返回']
        let tempCh = ch;
        for (let i = 0; i < 4; i++) {
            ret.push(tempCh.slice(0, Math.min(tempCh.length, len)));
            tempCh = tempCh.slice(len);
        }
        return ret;
    }
    const reducer = (state, action) => {
        const data = ['确定', 'abc', 'def', 'ghi', 'jkl', 'mno', 'pqrs', 'tuv', 'wxyz'];
        let op = actionToIndex(action);
        switch (state.status) {
            case 'idle':
                if (op === 0) { //enter; to decode candidates
                    if (state.input.length > 0) { 
                        // let candidates = IME.decode(state.input);
                        // console.log(candidates);
                        return {
                            ...state,
                            status: 'candidates',
                            candidatePos: 0,
                            candidates: candidates,
                            message: getCandidateMsg(candidates, 0)
                        };
                    }
                } else { //slide; to input level 0 characters
                    return {
                        ...state,
                        status: 'input',
                        level: 1,
                        prefix: [data],
                        message: getCharMsg(data[op])
                    }
                }
                return state;
            case 'input':
                if (op === 0) { //back; to input last level  or  back to idle
                    return {
                        ...state,
                        status: state.level === 1 ? 'idle': 'input',
                        level: state.level - 1,
                        message: state.level ===1 ? data : getCharMsg(state.prefix[state.level - 1]),
                        prefix: state.prefix.slice(0, state.level - 1)
                    };
                } else { // continue input;
                    let result = state.message[op];
                    let newInput = state.input;
                    if (result.length === 1) {
                        newInput = state.input + result;
                    }
                    if (result.length === 0) return state;
                    return {
                        ...state,
                        status: result.length === 1? 'idle': 'input',
                        input: newInput,
                        level: state.level + 1,
                        message: result.length === 1? data: getCharMsg(state.message[op]),
                        prefix: result.length === 1? []: [...state.prefix, getCharMsg(state.message[op])]
                    }
                }
                return state;
            case 'candidates':
                if (op === 2 || op === 4) { // 2, next page;;;; 4, previous page
                    let newCandiatePos = state.candidatePos + 3 * (3  - op);
                    if (newCandiatePos < 0) { //cancel input
                        return {
                            ...state,
                            status: 'idle',
                            level: 0,
                            message: data,
                            input: ''
                        }
                    } else if (newCandiatePos >= state.candidates.length) {
                        return state;
                    } else {
                        return {
                            ...state,
                            status: 'candidates',
                            message: getCandidateMsg(state.candidates, newCandiatePos),
                            candidatePos: newCandiatePos
                        }
                    }
                } else { //select candidates
                    let cand = state.message[op];
                    if (cand.length > 0) {
                        return {
                            ...state,
                            commit: state.commit + cand,
                            status: 'idle',
                            input: '',
                            level: 0,
                            message: data,
                            prefix: []
                        }
                    }
                }
            default:
                return state;
        }
        // const keyData = {
        //     'data': ['确定', 'abcdefg', 'hijklmn', 'opqrst', 'uvwxya'],
        //     'abcdefg': {
        //         data: ['返回', 'abc', 'def', 'g']
        //     }
      
    }

    const [state, dispatch] = useReducer(reducer, {'status': 'idle', message: ['确定', 'abc', 'def', 'ghi', 'jkl', 'mno', 'pqrs', 'tuv', 'wxyz'], prefix: [], input: '', commit: ''});



    useEffect(() => {
        console.log("trying to connect to "+ document.domain+':8080');
        const socket = io(document.domain+':8080');
        socket.on('connect', () => {
            console.log(document.domain+':8080'+'connected!!');
        });
        socket.on('data', function(data) {
            let lines = data.split('\n');
            lines.forEach(element => {
                if (element.length > 0) {
                    console.log('[socket] dispatch : ' + element);
                    dispatch(element);
                }
            });
        });
        return function closeSocket() {
            socket.close();
        }
    }, []);

    useEffect(() => {
        window.addEventListener('keydown', (event) => {
            console.log("in key down|" + event.code+"|");
            switch (event.code) {
                case 'ArrowLeft':
                    event.preventDefault();
                    dispatch('left');
                    return;
                case 'ArrowRight':
                    event.preventDefault();
                    dispatch('right');
                    return;
                case 'Space':
                    event.preventDefault();
                    dispatch('click');
                    return;
                case 'ArrowUp':
                    event.preventDefault();
                    dispatch('up');
                    return;
                case 'ArrowDown':
                    event.preventDefault();
                    dispatch('down');
                    return;
                default:
                    return;
            }
        });
    }, []);


    let settingsExtra = () => (
        <Space>
        <SettingOutlined onClick={event=>setShowSettings(true)}/>
        {fullScreenHandle.active
          ? <FullscreenExitOutlined onClick={fullScreenHandle.exit}/>
          : <FullscreenOutlined onClick={fullScreenHandle.enter}/>
        }
        </Space>
    );

    let settingsClosed = () => {
        setShowSettings(false);
    }

    const formLayout = {
        labelCol: {
          span: 8,
        },
        wrapperCol: {
          span: 16,
        },
        labelAlign: 'left'
    };


    return (
      <FullScreen handle={fullScreenHandle}>
      <Card title="中文输入" extra={settingsExtra()} style={{height: '100%', textAlign:'center'}} bodyStyle={{height: '100%'}}>
          <h3>当前中文输入：{state.commit + '_'}</h3>
          <h3>当前拼音串：{state.input + '_'}</h3>
          <Selector data={state.message} radius={200} hasCenter={true}/>
          <Divider>键盘绑定</Divider>
          方向键+空格键
        <Drawer 
              visible={showSettings} 
              onClose={settingsClosed}
              width={720}
              title='设置'>
            </Drawer>
      </Card>   
      </FullScreen> 
    );
}

export default ChineseIME;