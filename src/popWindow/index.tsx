import { Image, Text, View } from '@tarojs/components'
import React, { useEffect, useState } from 'react'
import styles from './index.module.scss'

function PopWindow(props) {
  const {
    close,
    children,
    title,
    style,
    showHeader = true
  } = props

  const [animaFlag, setAnimaFlag] = useState(true)

  useEffect(() => {
    if (!animaFlag) {
      setTimeout(() => {
        close && close()
      }, 250)
    }
  }, [animaFlag])

  const animaPop = () => {
    setAnimaFlag(false)
  }

  return (
    <View className={animaFlag ? styles.mask : styles.mask_down} style={style} catchMove onClick={animaPop}>
      <View className={animaFlag ? styles.pop : styles.pop_down}>
        {
          showHeader ?
            <View className={styles.nxe_filter_title} onClick={e => e.stopPropagation()}>
              <Text></Text>
              <Text className={styles.title}>{title}</Text>
              <Text
                className={styles.nxe_ft_x}
                onClick={animaPop}>X</Text>
            </View>
            : null
        }
        <View>
          {
            React.cloneElement(children, { backFunc: setAnimaFlag })
          }
        </View>
      </View>
    </View>
  )
}

export default PopWindow;