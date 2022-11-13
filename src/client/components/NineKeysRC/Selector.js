// A component for selecting one target in 8 candidates
import React from 'react';
import './ninekeysRC.css';
const Selector = (props) => {
    let chosenId = props.chosenId;
    let radius = props.radius;
    let hasCenter = props.hasCenter === undefined ? false : props.hasCenter;
    let data = props.data;
    if (hasCenter) {
        data = props.data.slice(1);
    }
    let angleStep = 2 * Math.PI / data.length;
    let items = []
    let leftItems = []
    let rightItems = []
    for (let no in data) {
        no = parseInt(no);
        let item = data[no];
        let angle = Math.PI / 2 - no * angleStep - Math.PI / 8;
        let width = radius * Math.sin(angleStep / 2);
        let posFactor = hasCenter ? 0.8 : 0.5;
        let xpos = radius + radius * posFactor * Math.cos(angle) - width / 2;
        let ypos = radius - radius * posFactor * Math.sin(angle);
        items.push(
            <div key={no} style={{ display: 'inline-block', position: 'absolute', left: xpos + 'px', top: ypos + 'px', width: width + 'px', textAlign: 'center', height: '1.25em', lineHeight: '1.25', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#00b0f0', fontSize: '20px', fontWeight: 'bold' }}>
                {item}
            </div>
        )
        if (no + 2 <= 5) {
            leftItems.push(
                <div className={`circle-left${chosenId === no ? " chosen-circle" : ""}`} id={`circle${no + 2}`} key={no}></div>
            )
        } else {
            rightItems.push(
                <div className={`circle-right${chosenId === no ? " chosen-circle" : ""}`} id={`circle${no + 2}`} key={no}></div>
            )
        }
    }
    rightItems = rightItems.reverse(); // important !!
    let lines = []
    for (let i = 0; i < data.length; i++) {
        let angle = -Math.PI / 2 + (i - 0.5) * angleStep + Math.PI / 8;
        lines.push(
            <div key={i} style={{ height: '1px', backgroundColor: 'white', width: radius + 'px', position: 'absolute', left: radius + 'px', top: radius + 'px', transform: 'rotate(' + angle + 'rad)', transformOrigin: 'left' }}></div>
        );
    }
    let centerBlock = []
    if (hasCenter) {
        centerBlock =
            <div key={0} className="center-circle" style={{ position: 'absolute', backgroundColor: '#B8DFD8', left: radius * 0.5 + 'px', top: radius * 0.5 + 'px', borderRadius: '50%', width: radius + 'px', height: radius + 'px' }}>
                <div className="center" style={{ width: radius + 'px', height: '1.25em', lineHeight: '1.25', position: 'absolute', top: radius * 0.5 + 'px' }}>{props.data[0]}</div>
            </div>
            ;
    }
    return (
        <div style={{ width: radius * 2 + 'px', height: 2 * radius + 'px', position: 'relative', margin: 'auto' }}>
            <div id="circle0" className='unchosen-circle'>
                <div id="left">
                    {leftItems}
                </div>
                <div id="right">
                    {rightItems}
                </div>
            </div>
            {items}
            {lines}
            {centerBlock}
        </div>
    );

};

export default Selector;