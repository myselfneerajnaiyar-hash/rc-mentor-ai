'use client'
import { Component } from 'react'
import s from './bootcamp.module.css'

export default class BootCampReviewBoundary extends Component {
  state = { failed:false }
  static getDerivedStateFromError() { return {failed:true} }
  componentDidCatch(error) {
    console.error('Boot Camp review could not render', {attemptId:this.props.attemptId,block:this.props.block}, error)
  }
  render() {
    if (this.state.failed) return <div className={s.error} role="alert">This block's review could not be displayed. Your submitted answers are saved.<div className={s.actions}><button className={s.secondary} onClick={this.props.onRetry}>Reload saved progress</button></div></div>
    return this.props.children
  }
}
