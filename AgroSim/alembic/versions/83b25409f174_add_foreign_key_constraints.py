"""add foreign key constraints

Revision ID: 83b25409f174
Revises: 96228568485b
Create Date: 2026-05-11 17:27:41.599122

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '83b25409f174'
down_revision: Union[str, Sequence[str], None] = '96228568485b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table('regions') as batch_op:
        batch_op.create_foreign_key('fk_regions_user_id', 'users', ['user_id'], ['id'], ondelete='SET NULL')

    with op.batch_alter_table('weather_data') as batch_op:
        batch_op.create_foreign_key('fk_weather_data_region_id', 'regions', ['region_id'], ['id'], ondelete='CASCADE')

    with op.batch_alter_table('simulation_results') as batch_op:
        batch_op.create_foreign_key('fk_simulation_results_region_id', 'regions', ['region_id'], ['id'], ondelete='CASCADE')
        batch_op.create_foreign_key('fk_simulation_results_user_id', 'users', ['user_id'], ['id'], ondelete='SET NULL')


def downgrade() -> None:
    with op.batch_alter_table('simulation_results') as batch_op:
        batch_op.drop_constraint('fk_simulation_results_region_id', type_='foreignkey')
        batch_op.drop_constraint('fk_simulation_results_user_id', type_='foreignkey')

    with op.batch_alter_table('weather_data') as batch_op:
        batch_op.drop_constraint('fk_weather_data_region_id', type_='foreignkey')

    with op.batch_alter_table('regions') as batch_op:
        batch_op.drop_constraint('fk_regions_user_id', type_='foreignkey')
