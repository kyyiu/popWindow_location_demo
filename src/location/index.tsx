import { regionData } from './../../province'
import { place } from './../../place';
import { Text, View } from '@tarojs/components';
import Taro from '@tarojs/taro';
import React, { Fragment, useEffect, useState } from 'react';
import styles from './index.module.scss';

/*
  该组件可能存在过多的冗余代码, 待处理
*/

interface LocationProps {
  data: {
    locationNameList: string[] ,
    // 此处的number[][]是内部转换使用的，外部还是传入一维的
    locationCodeList: number[] | number[][]
  },
  fatherCb: (locationNameList: string[], locationCodeList: number[]) => void,
  type?: string | undefined, 
  backFunc?: (boolean) => void,
  multiple?: boolean,
  closeLevel?: number,
}

const specialAreaList = [110000, 120000, 310000, 500000, 710000, 810000, 820000]

const pxTransform = Taro.pxTransform

function showLastLeavel(placeCode) {
  switch(placeCode) {
    case 710000:
      return '全省'
    case 810000:
    case 820000:
      return '全区'
    default:
      return '全市'
  }
}

function Location(props: LocationProps) {
  const {
    data = {
      locationNameList: [],
      locationCodeList: [] // locationCodeList  地区id数组 为一维的最下级id，比如四川*成都*锦江 则传入[510104] 四川*成都则传入[510100]
    },
    fatherCb,
    type, // type 显示特殊标签全省，全市等， 为card或者不传
    backFunc, // backFunc 返回函数, 此组件一般和PopWindow组合, backFunc从PopWindow中得到,或者直接使用此组件，自定义该函数
    multiple = true, // multiple 可多选, 实现上是数组中可添加多个地址
    closeLevel, // closeLevel,关闭的层级，选择了省级level是1，如果closeLevel是1，表示选择了省级后关闭弹窗
  } = props
  
  
  
  
  
  
  const [refresh, setRefresh] = useState(false)
  const [province, setProvince] = useState<any []>(regionData)
  const [rc, setrc] = useState<any>([])
  const [level, setLevel] = useState(0)
  const [selectPlace, setSelectPlace] = useState<any>([])
  const [placeCode, setPlaceCode] = useState<any>([])
  const [labelSelected, setLabelSelected] = useState<any []>([])

  useEffect(()=>{
    data.locationCodeList = data.locationCodeList.map(ele => {
      let res: number[] = []
      const provinceId = Math.floor(ele / 10000) * 10000
      const hasCity = ele % 10000
      const hasArea = ele % 100
      res.push(provinceId);
      (hasCity && res.push(Math.floor(ele / 100) * 100)) || (specialAreaList.includes(provinceId) && res.push(provinceId))
      hasArea && res.push(ele) 
      return res
    })
    
    setrc(place)

  },[])

  useEffect(()=>{
    setRefresh(!refresh)

    if(level < 0 || (closeLevel && level >= closeLevel)){
      back()
    }
  },[selectPlace, level])

  const back=()=>{
    const {
      locationCodeList = []
    } = data
    let flag = false
    let upperCity = false
    locationCodeList.forEach(ele => {
      // 存在上级城市
      if((placeCode[0]===ele[0] && !ele[1] && placeCode[1]) || placeCode[1]===ele[1] && !ele[2] && placeCode[2]) {
        upperCity = true
      }
      // 存在相同城市
      if(JSON.stringify(ele) === JSON.stringify(placeCode)){
        flag = true
        setLevel(2)
      }
    });

    if (upperCity) {
      Taro.showToast({
        icon: 'none',
        title: '您已经选择了上级城市请重新选择'
      })
      return
    }
    
    if(flag && multiple) {
      Taro.showToast({
        icon: 'none',
        title: '此城市您已选择'
      })
      return
    }

    let locationTemp: any = [] 
    let locationCodeTemp: any = []
      if(data.locationNameList && data.locationCodeList){
        locationTemp = data.locationNameList.slice()
        locationCodeTemp = data.locationCodeList.slice()
      }
      
    let cityFilterFlag = true
    let special_city = specialAreaList.includes(placeCode[0])

      // 只选了省级
      if((!placeCode[1] && !special_city) || (special_city && !placeCode[2])){
        // 先筛选地区码，确定地区名字需要筛选哪些,地区名字情况较多比如内蒙古自治区，四川省，选择时名字是内蒙古，四川
        // 每次只能选择一个地址，使用一个值即可
        let tmp: any = []
        locationCodeTemp = locationCodeTemp.filter((ele, idx)=>{
          // 地址只留下不是同一个省的地址
          if (ele[0] !== placeCode[0]) {
            tmp.push(locationTemp[idx])
          }
          return ele[0]!==placeCode[0]
        })
        // 如果tmp为空则当前selectplace为省级，locationTemp中都是该省的下级或者没有值，直接替换
        // 如果不为空则筛选了不是该省的城市，也可以直接替换
        // 下面的selectPlace会更新到父亲state中
        locationTemp = tmp

        // 非特殊城市,筛了省级，就不要市级了
        if(!special_city) {
          cityFilterFlag = false
        }
      }
      
      // 只选了市级
      if(!placeCode[2] && cityFilterFlag && !special_city){
        locationTemp = locationTemp.filter(ele=>{
          return ele[1]!==selectPlace[1]
        })
        locationCodeTemp = locationCodeTemp.filter(ele=>{
          return ele[1]!==placeCode[1]
        })
      }

      let returnLocationList = (multiple ? [...locationTemp, selectPlace] : [selectPlace]) 
      let returnLocationCodeList = (multiple ? [...locationCodeTemp, placeCode] : [placeCode]) 
      returnLocationList = returnLocationList.map(ele => {
        return Array.isArray(ele) ? ele.join('·') : ele
      })

      returnLocationCodeList = returnLocationCodeList.map(ele => {
        return ele[ele.length-1]
      })
      fatherCb(returnLocationList, returnLocationCodeList)
      backFunc && backFunc(false)
  }

  const specialLabelClick = (index)=>{
    back()
  }

  const clickLable = (item, index) => {
    if(level<0){
      return
    }

    if(index === -1){
      const pCode =  placeCode[0]
      if(specialAreaList.includes(pCode)) {
        setLabelSelected(placeCode)
        setSelectPlace([])
        setPlaceCode([])
        setLevel(0)
        return
      }
      if(level>0) {
        setSelectPlace(pre=>{
          let tmp:any = []
          for(let i = 0;i<level-1;i++) {
            tmp[i] = pre[i]
          }
          return tmp
        })
        setPlaceCode(pre=>{
          let tmp:any = []
          for(let i = 0;i<level-1;i++) {
            tmp[i] = pre[i]
          }
          setLabelSelected(pre)
          return tmp
        })
        setLevel(level+index)
        return
      }
    }

    let samePlace = false
    const {
      locationCodeList = []
    } = data
    if(level===0) {
      locationCodeList.forEach(element => {
        let str = element.join('')
        if(str===''+item.id ){
          samePlace=true
        }
      });

      // 直辖市
      if(specialAreaList.includes(item.id)) {
        const specialCode = +item.id
        locationCodeList.forEach(element => {
          let str = element.join('')
          if(str===''+item.id + specialCode ){
            samePlace=true
          }
        });
      }

    } else if(level===1) {
      locationCodeList.forEach(element => {
        let str = element.join('')
        if(str===''+element[0] + item.id ){
          samePlace=true
        }
      });
    } else if (level===2) {
      locationCodeList.forEach(element => {
        if(element[2]===item.id ){
          samePlace=true
        }
      });
    }
    
    if(samePlace && multiple) {
      Taro.showToast({
        icon: 'none',
        title: '此城市您已选择'
      })
      return
    }

    // 市辖区
    if(item.id && specialAreaList.includes(item.id)){
      const cityCode = +item.id
      setSelectPlace(pre=>{
        pre[0] = item.label || item.name
        pre[1] = item.label || item.name
        return pre
      })
      setPlaceCode(pre=>{
        pre[0] = item.id
        pre[1] = cityCode
        return pre
      })
      setLevel(2)
      return
    }

    if(index > 0 || index===-3) {
      setSelectPlace(pre=>{
        pre[level] = item.label || item.name
        return pre
      })
      setPlaceCode(pre=>{
        pre[level] = item.value ? item.value : item.id
        return pre
      })
    }

    // 选中的不是省级，且不存在子级退出
    if ((item.id % 10000) && (!item.children || !item.children.length)) {
      setLevel(-2)
      return
    }
    
    // 继续走流程
    setLevel(level + index)
  }

  const readyBack = (e) => {
      e.stopPropagation()
  }
  return (
    <Fragment>
      <View className={styles.nxe_ws_container} onClick={e=>readyBack(e)}
        style={{height: `${level===0 ? pxTransform(869) : pxTransform(829)}`}}>
        <View className={styles.nxe_place}>
          <Text className={styles.nxe_ws_title}>{level===0 ? '地点':(placeCode[0]===500000?'重庆': ( level > 0 ? selectPlace[level-1] : selectPlace[1]))}</Text>
          {
            level>0?
            (
              <Text onClick={()=>clickLable('',-1)}>{'返回上一级'}</Text>
            ) : null
          }
        </View>
        <View className={styles.nxe_ws_label_container}>
          {
            level === 0 ?
            (
              <Fragment>
                {
                  province.map((item,index) => {
                    return  index !==0 ? (
                      <View key={item.id}
                        onClick={()=>clickLable(item, 1)}
                        className={item.id===labelSelected[0] ? styles.nxe_ws_label_selected : styles.nxe_ws_label}
                      >{item.label}</View>
                    ) : null
                  })
                }
                <Text></Text>
                <Text></Text>
              </Fragment>
            ) : null
          }
          {
            level===1 ?
            (
              <Fragment>
                {
                  type === 'card' && rc.length? 
                  (
                    <View className={styles.nxe_ws_label} onClick={()=>specialLabelClick(1)}>
                      {placeCode[0]!==810000 || placeCode[0]!==820000 ? '全省' : '全地区'}
                    </View>
                  ) :null
                }
                {
                  rc.length ? rc.filter(ele => ele.id === placeCode[0])[0]?.children.map(item=>{
                    return (
                      <View key={item.id}
                        onClick={()=>clickLable(item, 1)}
                        className={item.id===labelSelected[1] ? styles.nxe_ws_label_selected : styles.nxe_ws_label}
                      >{item.name.length>5 ? item.name.slice(0,4)+'...' : item.name}</View>
                    )
                  }) : '请稍等'
                }
                <Text></Text>
                <Text></Text>
              </Fragment>
            ) : null
          }
          {
            (level===2 || level<0) ?
            (
              <Fragment>
                {
                  type === 'card' && rc.length? 
                  (
                    <View className={styles.nxe_ws_label} onClick={()=>specialLabelClick(2)}>{showLastLeavel(placeCode[0])}</View>
                  ) :null
                }
                {/* 有三级的城市 */}
                {
                  rc.length && !specialAreaList.includes(placeCode[0]) ? rc.filter(ele => ele.id === placeCode[0])[0]?.children.filter(ele => ele.id === placeCode[1])[0].children.map(item => {
                    return (
                      <View key={item.id}
                        onClick={()=>clickLable(item, -3)}
                        className={labelSelected.indexOf(''+item) > -1 ? styles.nxe_ws_label_selected : styles.nxe_ws_label}
                      >{item.name.length>5 ? item.name.slice(0,4)+'...' : item.name}</View>
                    )
                  }) : rc.length && specialAreaList.includes(placeCode[0]) ? rc.filter(ele => ele.id === placeCode[0])[0]?.children.map(item => {
                    return (
                      <View key={item.id}
                        onClick={()=>clickLable(item, -3)}
                        className={labelSelected.indexOf(''+item) > -1 ? styles.nxe_ws_label_selected : styles.nxe_ws_label}
                      >{item.name.length>5 ? item.name.slice(0,4)+'...' : item.name}</View>
                    )
                  }) : '请稍等'
                }
                <Text></Text>
                <Text></Text>
              </Fragment>
            ) : null
          }
        </View>
        {/* <View className={styles.nxe_ws_btn} onClick={()=>submit('carList')}>提交</View> */}
      </View>
    </Fragment>
  )
}

export default Location;