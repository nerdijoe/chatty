// client/components/messages.component.js
import { _ } from 'lodash';
import {
  ActivityIndicator,
  ListView,
  Platform,
  StyleSheet,
  View,
} from 'react-native';
import React, { Component, PropTypes } from 'react';
import randomColor from 'randomcolor';
import { graphql, compose } from 'react-apollo';

import Message from './message.component';
import GROUP_QUERY from '../graphql/group.query';

const styles = StyleSheet.create({
  container: {
    alignItems: 'stretch',
    backgroundColor: '#e5ddd5',
    flex: 1,
    flexDirection: 'column',
    paddingTop: 64,
  },
  loading: {
    justifyContent: 'center',
  },
  titleWrapper: {
    alignItems: 'center',
    marginTop: 10,
    position: 'absolute',
    ...Platform.select({
      ios: {
        top: 15,
      },
      android: {
        top: 5,
      },
    }),
    left: 0,
    right: 0,
  },
  title: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleImage: {
    marginRight: 6,
    width: 32,
    height: 32,
    borderRadius: 16,
  },
});
const fakeData = () => _.times(100, i => ({
  // every message will have a different color
  color: randomColor(),
  // every 5th message will look like it's from the current user
  isCurrentUser: i % 5 === 0,
  message: {
    id: i,
    createdAt: new Date().toISOString(),
    from: {
      username: `Username ${i}`,
    },
    text: `Message ${i}`,
  },
}));
export class Messages extends Component {
  constructor(props) {
    super(props);
    this.state = {
      ds: new ListView.DataSource({ rowHasChanged: (r1, r2) => r1 !== r2 }),
      usernameColors: {},
    };
  }

  componentWillReceiveProps(nextProps) {
    const oldData = this.props;
    const newData = nextProps;
    const usernameColors = {};
    // check for new messages
    if (newData.group) {
      if (newData.group.users) {
        // apply a color to each user
        newData.group.users.map((user) => {
          usernameColors[user.username] = this.state.usernameColors[user.username] || randomColor();
        });
      }
      if (!!newData.group.messages &&
        (!oldData.group || newData.group.messages !== oldData.group.messages)) {
        // convert messages Array to ListView.DataSource
        // we will use this.state.ds to populate our ListView
        this.setState({
          ds: this.state.ds.cloneWithRows(
            // reverse the array so newest messages
            // show up at the bottom
            newData.group.messages.slice().reverse(),
          ),
          usernameColors,
        });
      }
    }
  }

  render() {
    const { loading, group } = this.props;

    // render loading placeholder while we fetch messages
    if (loading && !group) {
      return (
        <View style={[styles.loading, styles.container]}>
          <ActivityIndicator />
        </View>
      );
    }

    // render list of messages for group
    return (
      <View style={styles.container}>
        <ListView
          style={styles.listView}
          enableEmptySections
          dataSource={this.state.ds}
          renderRow={message => (
            <Message
              color={this.state.usernameColors[message.from.username]}
              message={message}
              isCurrentUser={message.from.id === 1} // for now until we implement auth
            />
          )}
        />
      </View>
    );
  }
}

Messages.propTypes = {
  group: PropTypes.shape({
    messages: PropTypes.array,
    users: PropTypes.array,
  }),
  loading: PropTypes.bool,
  groupId: PropTypes.number.isRequired,
  title: PropTypes.string.isRequired,
};

const groupQuery = graphql(GROUP_QUERY, {
  options: ({ groupId }) => ({ variables: { groupId } }),
  props: ({ data: { loading, group } }) => ({
    loading, group,
  }),
});

// export default Messages;

export default compose(
  groupQuery,
)(Messages);
