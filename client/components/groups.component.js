import { _ } from 'lodash';
import React, { Component, PropTypes } from 'react';
import {
  ActivityIndicator,
  ListView,
  Platform,
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
} from 'react-native';
import { Actions } from 'react-native-router-flux';
import { graphql, compose } from 'react-apollo';

import { USER_QUERY } from '../graphql/user.query';

const styles = StyleSheet.create({
  container: {
    marginBottom: 50, // tab bar height
    marginTop: Platform.OS === 'ios' ? 64 : 54, // nav bar height
    flex: 1,
  },
  loading: {
    justifyContent: 'center',
    flex: 1,
  },
  groupContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  groupName: {
    fontWeight: 'bold',
    flex: 0.7,
  },
});

// create fake data to populate our ListView
const fakeData = () => _.times(100, i => ({
  id: i,
  name: `Group ${i}`,
}));

class Group extends Component {
  constructor(props) {
    super(props);

    this.goToMessages = this.props.goToMessages.bind(
      this, this.props.group,
    );
  }

  render() {
    const { id, name } = this.props.group;

    return (
      <TouchableHighlight
        key={id}
        onPress={this.goToMessages}
      >
        <View style={styles.groupContainer}>
          <Text style={styles.groupName}>{`${name}`}</Text>
        </View>
      </TouchableHighlight>
    );
  }
}

Group.propTypes = {
  goToMessages: PropTypes.func.isRequired,
  group: PropTypes.shape({
    id: PropTypes.number,
    name: PropTypes.string,
  }),
};

class Groups extends Component {
  constructor(props) {
    super(props);
    this.state = {
      ds: new ListView.DataSource({ rowHasChanged: (r1, r2) => r1 !== r2 }),
    };
    this.goToMessages = this.goToMessages.bind(this);
  }

  // push the 'messages' scene and pass a groupId and title to props
  goToMessages(group) {
    Actions.messages({ groupId: group.id, title: group.name });
  }

  componentWillReceiveProps(nextProps) {
    if (!nextProps.loading && nextProps.user !== this.props.user) {
      // convert groups Array to ListView.DataSource
      // we will use this.state.ds to populate our ListView
      this.setState({
        // cloneWithRows computes a diff and decides whether to rerender
        ds: this.state.ds.cloneWithRows(nextProps.user.groups),
      });
    }
  }

  render() {
    const { loading } = this.props;

    // render loading while fetching
    if (loading) {
      return (
        <View style={[styles.loading, styles.container]}>
          <ActivityIndicator />
        </View>
      );
    }

    return (
      <View style={styles.container}>
        <ListView
          enableEmptySections
          dataSource={this.state.ds}
          renderRow={(group => (
            <Group group={group} goToMessages={this.goToMessages} />
          ))}
        />
      </View>
    );
  }
}
Groups.propTypes = {
  loading: PropTypes.bool,
  user: PropTypes.shape({
    id: PropTypes.number.isRequired,
    email: PropTypes.string.isRequired,
    groups: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.number.isRequired,
        name: PropTypes.string.isRequired,
      }),
    ),
  }),
};

// graphql() returns a func that can be applied to a React component
// set the id variable for USER_QUERY using the component's existing props
const userQuery = graphql(USER_QUERY, {
  options: () => ({ variables: { id: 1 } }),
  props: ({ data: { loading, user } }) => ({
    loading, user,
  }),
});

// Groups props will now have a 'data' paramater with the results from graphql (e.g. this.props.data.user)
// export default Groups;
// export default userQuery(Groups);

export default compose(
  userQuery,
)(Groups);

// const componentWithData = compose(
//   userQuery,                                    // first query
// )(Groups);
// export default componentWithData;

// export default userQuery(Groups);
