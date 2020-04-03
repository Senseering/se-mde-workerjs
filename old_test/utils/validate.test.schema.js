module.exports = {
    'definitions': {},
    '$schema': 'http://json-schema.org/draft-07/schema#',
    '$id': 'http://example.com/root.json',
    'type': 'object',
    'title': 'The Root Schema',
    'required': [
      'id',
      'location',
      'machine_timestamp',
      'machine_id',
      'machine',
      'price',
      'signature',
      'data'
    ],
    'properties': {
      'id': {
        '$id': '#/properties/id',
        'type': 'string',
        'minLength': 36,
        'maxLength': 36,
        'title': 'The Id Schema',
        'examples': [
          '39dd809c-2caf-4236-8045-8f02954e37ab'
        ]
      },
      'location': {
        '$id': '#/properties/location',
        'type': 'string',
        'title': 'The Location Schema',
        'default': '',
        'examples': [
          'Aachen'
        ],
        'pattern': '^(.*)$'
      },
      'machine_timestamp': {
        '$id': '#/properties/machine_timestamp',
        'type': 'integer',
        'title': 'The Machine_timestamp Schema',
        'default': 0,
        'examples': [
          1534601229832,
          1535111077650
        ],
        'minlength': 13,
        'maxlength': 13
      },
      'machine_id': {
        '$id': '#/properties/machine_id',
        'type': 'integer',
        'title': 'The Machine ID Schema',
        'default': 0,
        'examples': [
          1
        ]
      },
      'machine': {
        '$id': '#/properties/machine',
        'type': 'string',
        'title': 'The Machine Schema',
        'default': '',
        'examples': [
          'XFT_2500_speed'
        ],
        'pattern': '^(.*)$'
      },
      'price': {
        '$id': '#/properties/price',
        'type': 'integer',
        'title': 'The Price Schema',
        'default': 0,
        'examples': [
          1000
        ]
      },
      'signature': {
        '$id': '#/properties/signature',
        'type': 'string',
        'title': 'The Signature Schema',
        'default': '',
        'examples': [
          'ZGllX3JvbGw9Ny43J[ ... Many more ]'
        ],
        'pattern': '^(.*)$'
      },
      'data': {
        '$id': '#/properties/data',
        'type': 'object',
        'title': 'The Data Schema',
        'required': [
          'id',
          'location',
          'machine_timestamp',
          'machine_id',
          'machine',
          'material',
          'punch_force',
          'punch_stroke',
          'die_roll'
        ],
        'properties': {
          'id': {
            '$id': '#/properties/data/properties/id',
            'type': 'string',
            'title': 'The Id Schema',
            'default': '',
            'examples': [
              '39dd809c-2caf-4236-8045-8f02954e37ab'
            ],
            'pattern': '^(.*)$'
          },
          'location': {
            '$id': '#/properties/data/properties/location',
            'type': 'string',
            'title': 'The Location Schema',
            'default': '',
            'examples': [
              'Aachen'
            ],
            'pattern': '^(.*)$'
          },
          'machine_timestamp': {
            '$id': '#/properties/data/properties/machine_timestamp',
            'type': 'integer',
            'title': 'The Machine_timestamp Schema',
            'default': 0,
            'examples': [
              1534601229832
            ]
          },
          'machine_id': {
            '$id': '#/properties/data/properties/machine_id',
            'type': 'integer',
            'title': 'The Machine ID Schema',
            'default': 0,
            'examples': [
              1
            ]
          },
          'machine': {
            '$id': '#/properties/data/properties/machine',
            'type': 'string',
            'title': 'The Machine Schema',
            'default': '',
            'examples': [
              'XFT_2500_speed'
            ],
            'pattern': '^(.*)$'
          },
          'material': {
            '$id': '#/properties/data/properties/material',
            'type': 'string',
            'title': 'The Material Schema',
            'default': '',
            'examples': [
              '16MnCr5'
            ],
            'pattern': '^(.*)$'
          },
          'punch_force': {
            '$id': '#/properties/data/properties/punch_force',
            'type': 'number',
            'title': 'The Punch_force Schema',
            'default': 0,
            'examples': [
              3391
            ]
          },
          'punch_stroke': {
            '$id': '#/properties/data/properties/punch_stroke',
            'type': 'number',
            'title': 'The Punch_stroke Schema',
            'default': 0,
            'examples': [
              556
            ]
          },
          'die_roll': {
            '$id': '#/properties/data/properties/die_roll',
            'type': 'number',
            'title': 'The Die_roll Schema',
            'default': 0,
            'examples': [
              7
            ]
          }
        }
      }
    }
  }