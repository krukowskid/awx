import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { object } from 'prop-types';

import { CardBody } from '../../../components/Card';
import { InventoriesAPI } from '../../../api';
import ContentLoading from '../../../components/ContentLoading';
import InventoryForm from '../shared/InventoryForm';
import { getAddedAndRemoved } from '../../../util/lists';
import useIsMounted from '../../../util/useIsMounted';

function InventoryEdit({ inventory }) {
  const [error, setError] = useState(null);
  const [associatedInstanceGroups, setInstanceGroups] = useState(null);
  const [contentLoading, setContentLoading] = useState(true);
  const history = useHistory();
  const isMounted = useIsMounted();

  useEffect(() => {
    const loadData = async () => {
      try {
        const {
          data: { results: loadedInstanceGroups },
        } = await InventoriesAPI.readInstanceGroups(inventory.id);
        if (!isMounted.current) {
          return;
        }
        setInstanceGroups(loadedInstanceGroups);
      } catch (err) {
        setError(err);
      } finally {
        if (isMounted.current) {
          setContentLoading(false);
        }
      }
    };
    loadData();
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [inventory.id, contentLoading, inventory]);

  const handleCancel = () => {
    const url =
      inventory.kind === 'smart'
        ? `/inventories/smart_inventory/${inventory.id}/details`
        : `/inventories/inventory/${inventory.id}/details`;

    history.push(`${url}`);
  };

  const handleSubmit = async values => {
    const { instanceGroups, organization, ...remainingValues } = values;
    try {
      await InventoriesAPI.update(inventory.id, {
        organization: organization.id,
        ...remainingValues,
      });
      if (instanceGroups) {
        const { added, removed } = getAddedAndRemoved(
          associatedInstanceGroups,
          instanceGroups
        );

        const associatePromises = added.map(async ig =>
          InventoriesAPI.associateInstanceGroup(inventory.id, ig.id)
        );
        const disassociatePromises = removed.map(async ig =>
          InventoriesAPI.disassociateInstanceGroup(inventory.id, ig.id)
        );
        await Promise.all([...associatePromises, ...disassociatePromises]);
      }
      const url =
        history.location.pathname.search('smart') > -1
          ? `/inventories/smart_inventory/${inventory.id}/details`
          : `/inventories/inventory/${inventory.id}/details`;
      history.push(`${url}`);
    } catch (err) {
      setError(err);
    }
  };

  if (contentLoading) {
    return <ContentLoading />;
  }

  return (
    <CardBody>
      <InventoryForm
        onCancel={handleCancel}
        onSubmit={handleSubmit}
        inventory={inventory}
        instanceGroups={associatedInstanceGroups}
        submitError={error}
      />
    </CardBody>
  );
}

InventoryEdit.propType = {
  inventory: object.isRequired,
};

export { InventoryEdit as _InventoryEdit };
export default InventoryEdit;
