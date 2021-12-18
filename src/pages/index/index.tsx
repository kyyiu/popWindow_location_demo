import { Component, Fragment } from 'react'
import { View, Text } from '@tarojs/components'
import './index.scss'

import Location from '../../location'
import PopWindow from '../../popWindow'

interface Index {
  state: {
    isShowPop: boolean,
    isShowCard: boolean,
    isMutiple: boolean,
    locationData: {
      locationNameList: string[],
      locationCodeList: number[]
    }
  }
}

class Index extends Component {

  state = {
    isShowPop: false,
    isShowCard: false,
    isMutiple: false,
    locationData: {
      locationNameList: [] as string[],
      locationCodeList: [] as number[]
    }
  }

  componentWillMount() { }

  componentDidMount() { }

  componentWillUnmount() { }

  componentDidShow() { }

  componentDidHide() { }

  togglePop = () => {
    this.setState({
      isShowPop: !this.state.isShowPop
    })
  }

  toggleCard = () => {
    this.setState({
      isShowCard: !this.state.isShowCard
    })
  }

  toggleMutiple = () => {
    this.setState({
      locationData: {
        locationNameList: [],
        locationCodeList: []
      },
      isMutiple: !this.state.isMutiple
    })
  }

  handleChangeLocation = (locationNameList: string[], locationCodeList: number[]) => {
    this.setState({
      locationData: {
        locationNameList,
        locationCodeList
      }
    })
  }

  render() {
    const {
      isShowPop,
      locationData,
      isMutiple,
      isShowCard
    } = this.state
    return (
      <Fragment>
        <View className='index'>
          <View onClick={this.toggleCard}>是否显示全省选项(点我变化):{isShowCard ? '是' : '否'}</View>
          <View onClick={this.toggleMutiple}>是否多选(点我变化):{isMutiple ? '是' : '否'}</View>
          <View onClick={this.togglePop}>点我弹出</View>
          <View>
            <View>
              {
                locationData.locationNameList.map((ele, idx) => <View className='df jcc' key={idx}>
                  {ele}---{locationData.locationCodeList[idx]}
                </View>)
              }
            </View>
          </View>
        </View>
        {
          isShowPop ? <PopWindow title={'地址'} close={this.togglePop}>
            {/* 注意不要直接传入 locationData, 这是引用类型, 不然会影响原来的数据*/}
            <Location
              type={isShowCard ? 'card' : ''}
              data={{...locationData}}
              fatherCb={this.handleChangeLocation}
              multiple={isMutiple}
            />
          </PopWindow> : null
        }
      </Fragment>
    )
  }
}

export default Index
